import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date, timedelta, timezone
from collections import defaultdict

from app.models.schemas import (
    ActualRecord,
    ForecastRecord,
    MatchedIntervalRecord,
    ForecastPublicationOption,
    PublicationExplorerResponse,
)

logger = logging.getLogger(__name__)

def parse_iso_utc(ts_str: str) -> datetime:
    """Parse ISO 8601 string to a timezone-aware UTC datetime."""
    clean = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def format_iso_utc(dt: datetime) -> str:
    """Format datetime to ISO 8601 UTC string with Z suffix."""
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def calculate_day_ahead_cutoff(delivery_dt: datetime, cutoff_hour: int = 11, cutoff_minute: int = 0) -> datetime:
    """
    Calculate the day-ahead auction cutoff datetime for a given target delivery datetime.
    In the UK power market (EPEX SPOT / Nord Pool GB Day-Ahead Auctions):
    - Trading for all settlement periods of Day D takes place on Day D - 1.
    - Auction gate closure is at 11:00 GMT (UTC).
    """
    delivery_date = delivery_dt.date()
    decision_date = delivery_date - timedelta(days=1)
    return datetime(
        decision_date.year,
        decision_date.month,
        decision_date.day,
        cutoff_hour,
        cutoff_minute,
        0,
        tzinfo=timezone.utc
    )

def match_day_ahead_forecasts(
    actuals: List[ActualRecord],
    forecasts: List[ForecastRecord],
    cutoff_hour: int = 11,
    cutoff_minute: int = 0,
    interpolate_half_hourly: bool = True
) -> Tuple[List[MatchedIntervalRecord], List[str]]:
    """
    Match actual generation against day-ahead forecasts strictly avoiding lookahead bias.
    
    Selection Rule:
      For each delivery interval at target delivery time T on day D:
      1. Decision cutoff = (D - 1) at cutoff_hour:cutoff_minute UTC.
      2. Eligible forecasts = all forecasts for target time T published on or before the cutoff.
      3. Selected forecast = forecast with max(publishTime) among eligible forecasts.
      4. Any forecast published after cutoff is strictly excluded to prevent data leakage.
    """
    notes: List[str] = []
    if not actuals or not forecasts:
        notes.append("No actuals or forecasts available for matching.")
        return [], notes

    # Group forecasts by target startTime: Dict[startTime, List[ForecastRecord]]
    forecasts_by_target: Dict[str, List[ForecastRecord]] = defaultdict(list)
    for f in forecasts:
        forecasts_by_target[f.startTime].append(f)

    # Sort candidates by publishTime
    for st in forecasts_by_target:
        forecasts_by_target[st].sort(key=lambda x: parse_iso_utc(x.publishTime))

    matched_records: List[MatchedIntervalRecord] = []
    unmatched_actual_count = 0
    missing_before_cutoff_count = 0

    # Also build a lookup of selected hourly forecasts to support half-hour interpolation if requested
    selected_hourly_forecasts: Dict[str, Tuple[ForecastRecord, datetime]] = {}

    for act in actuals:
        target_dt = parse_iso_utc(act.startTime)
        cutoff_dt = calculate_day_ahead_cutoff(target_dt, cutoff_hour, cutoff_minute)

        candidates = forecasts_by_target.get(act.startTime, [])
        eligible = [c for c in candidates if parse_iso_utc(c.publishTime) <= cutoff_dt]

        if eligible:
            # Latest forecast published prior to cutoff
            best_forecast = eligible[-1]
            pub_dt = parse_iso_utc(best_forecast.publishTime)
            lead_time_h = (target_dt - pub_dt).total_seconds() / 3600.0

            error_mw = best_forecast.generation - act.generation
            abs_err = abs(error_mw)
            pct_err = (abs_err / act.generation * 100.0) if act.generation > 0 else None

            rec = MatchedIntervalRecord(
                targetTime=act.startTime,
                settlementDate=act.settlementDate,
                settlementPeriod=act.settlementPeriod,
                forecastPublishTime=best_forecast.publishTime,
                forecastGeneration=round(best_forecast.generation, 2),
                actualGeneration=round(act.generation, 2),
                signedError=round(error_mw, 2),
                absoluteError=round(abs_err, 2),
                percentageError=round(pct_err, 2) if pct_err is not None else None,
                leadTimeHours=round(lead_time_h, 2),
                isInterpolated=False
            )
            matched_records.append(rec)
            if target_dt.minute == 0:
                selected_hourly_forecasts[act.startTime] = (best_forecast, pub_dt)
        else:
            if candidates:
                missing_before_cutoff_count += 1
            else:
                unmatched_actual_count += 1

    # If interpolate_half_hourly is enabled, check half-hourly intervals (:30) that had no direct forecast
    if interpolate_half_hourly:
        interpolated_records: List[MatchedIntervalRecord] = []
        for act in actuals:
            target_dt = parse_iso_utc(act.startTime)
            if target_dt.minute == 30:
                # Check if this interval was already matched directly
                already_matched = any(m.targetTime == act.startTime for m in matched_records)
                if not already_matched:
                    t_prev = target_dt - timedelta(minutes=30)
                    t_next = target_dt + timedelta(minutes=30)
                    str_prev = format_iso_utc(t_prev)
                    str_next = format_iso_utc(t_next)

                    if str_prev in selected_hourly_forecasts and str_next in selected_hourly_forecasts:
                        fc_prev, pub_prev = selected_hourly_forecasts[str_prev]
                        fc_next, pub_next = selected_hourly_forecasts[str_next]

                        # Linear interpolation between adjacent hourly forecasts
                        interp_gen = (fc_prev.generation + fc_next.generation) / 2.0
                        latest_pub_dt = max(pub_prev, pub_next)
                        lead_time_h = (target_dt - latest_pub_dt).total_seconds() / 3600.0

                        error_mw = interp_gen - act.generation
                        abs_err = abs(error_mw)
                        pct_err = (abs_err / act.generation * 100.0) if act.generation > 0 else None

                        interp_rec = MatchedIntervalRecord(
                            targetTime=act.startTime,
                            settlementDate=act.settlementDate,
                            settlementPeriod=act.settlementPeriod,
                            forecastPublishTime=format_iso_utc(latest_pub_dt),
                            forecastGeneration=round(interp_gen, 2),
                            actualGeneration=round(act.generation, 2),
                            signedError=round(error_mw, 2),
                            absoluteError=round(abs_err, 2),
                            percentageError=round(pct_err, 2) if pct_err is not None else None,
                            leadTimeHours=round(lead_time_h, 2),
                            isInterpolated=True
                        )
                        interpolated_records.append(interp_rec)

        if interpolated_records:
            matched_records.extend(interpolated_records)
            matched_records.sort(key=lambda x: x.targetTime)
            notes.append(
                f"Interpolated {len(interpolated_records)} intermediate 30-min settlement intervals (:30) "
                f"from verified pre-cutoff hourly forecasts."
            )

    notes.append(
        f"Matched {len(matched_records)} intervals using day-ahead auction cutoff at "
        f"{cutoff_hour:02d}:{cutoff_minute:02d} UTC on D-1. "
        f"All post-cutoff publications strictly excluded to eliminate lookahead bias."
    )
    if missing_before_cutoff_count > 0:
        notes.append(
            f"{missing_before_cutoff_count} intervals had forecast data published after the cutoff, "
            f"correctly excluded to avoid data leakage."
        )

    return matched_records, notes

def explore_publications_for_interval(
    target_time_str: str,
    actuals: List[ActualRecord],
    forecasts: List[ForecastRecord],
    cutoff_hour: int = 11,
    cutoff_minute: int = 0
) -> PublicationExplorerResponse:
    """
    Inspect all published forecasts for a specific target delivery interval.
    Shows the cutoff threshold and identifies the exact forecast selected for day-ahead decision.
    """
    target_dt = parse_iso_utc(target_time_str)
    cutoff_dt = calculate_day_ahead_cutoff(target_dt, cutoff_hour, cutoff_minute)
    cutoff_str = format_iso_utc(cutoff_dt)

    actual_mw = None
    for a in actuals:
        if a.startTime == target_time_str:
            actual_mw = a.generation
            break

    # Find all forecasts published for this target time
    candidates = [f for f in forecasts if f.startTime == target_time_str]
    candidates.sort(key=lambda x: parse_iso_utc(x.publishTime))

    options: List[ForecastPublicationOption] = []
    selected_option: Optional[ForecastPublicationOption] = None

    eligible_candidates = [c for c in candidates if parse_iso_utc(c.publishTime) <= cutoff_dt]
    latest_eligible = eligible_candidates[-1] if eligible_candidates else None

    for c in candidates:
        pub_dt = parse_iso_utc(c.publishTime)
        lead_time = (target_dt - pub_dt).total_seconds() / 3600.0
        is_eligible = pub_dt <= cutoff_dt
        is_selected = (latest_eligible is not None and c.publishTime == latest_eligible.publishTime)

        opt = ForecastPublicationOption(
            publishTime=c.publishTime,
            generation=round(c.generation, 2),
            leadTimeHours=round(lead_time, 2),
            isEligibleDayAhead=is_eligible,
            isSelected=is_selected
        )
        options.append(opt)
        if is_selected:
            selected_option = opt

    rule_desc = (
        f"Day-Ahead Selection Rule: For target interval {target_time_str}, "
        f"auction gate closure was {cutoff_str} (D-1 {cutoff_hour:02d}:{cutoff_minute:02d} UTC). "
        f"Selected the latest publication strictly on or before this cutoff."
    )

    return PublicationExplorerResponse(
        targetTime=target_time_str,
        actualGeneration=actual_mw,
        dayAheadCutoff=cutoff_str,
        selectedForecast=selected_option,
        allPublications=options,
        selectionRule=rule_desc
    )
