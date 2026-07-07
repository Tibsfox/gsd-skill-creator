---
name: time-series-analysis
description: Analyzing and forecasting data ordered in time. Covers stationarity and differencing, autocorrelation (ACF and PACF), AR, MA, ARMA, and ARIMA models, the Box-Jenkins methodology, seasonality and SARIMA, forecasting with prediction intervals, and residual diagnostics including the Ljung-Box test. Use when data is indexed by time, when forecasting future values, when detecting trend or seasonality, or when checking whether residuals still carry structure.
type: skill
category: statistics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-07-06
first_path: examples/skills/statistics/time-series-analysis/SKILL.md
superseded_by: null
---
# Time-Series Analysis

A time series is a sequence of observations indexed by time, where the ordering matters and successive observations are typically dependent. That dependence violates the independence assumption behind ordinary regression, so time series needs its own toolkit. This skill covers the classical Box-Jenkins pipeline: make the series stationary, read the autocorrelation structure to identify a model, fit an ARIMA (or SARIMA) model, and validate it through residual diagnostics before forecasting.

**Agent affinity:** box (Box-Jenkins methodology, model identification, diagnostics), efron (computational fitting, resampling-based prediction intervals)

**Concept IDs:** stat-descriptive-statistics, stat-hypothesis-testing

## Stationarity and Differencing

### What stationarity means

A series is **weakly (covariance) stationary** when three things hold constant over time:

1. **Constant mean:** no trend drifting up or down.
2. **Constant variance:** spread does not grow or shrink over time.
3. **Autocovariance depends only on lag:** the relationship between observations `k` steps apart is the same everywhere in the series, not on the absolute time.

Most classical methods (AR, MA, ARMA) require stationarity. Real series usually are not stationary out of the box -- they trend, drift, or have changing variance -- so the first job is to transform them into a stationary series.

### Making a series stationary

| Problem | Transformation |
|---|---|
| Non-constant variance (spread grows with level) | Log or Box-Cox transform |
| Trend / non-constant mean | First differencing: `w_t = y_t - y_{t-1}` |
| Trend that remains after one difference | Second differencing (rarely need `d > 2`) |
| Seasonal pattern | Seasonal differencing: `y_t - y_{t-s}` for period `s` |

First differencing removes a linear trend; the differenced series models the change from one period to the next. The number of regular differences needed is the `d` in ARIMA(p, d, q).

### Testing for stationarity

- **Augmented Dickey-Fuller (ADF) test:** null hypothesis is a unit root (non-stationary). A small p-value is evidence *for* stationarity.
- **KPSS test:** null hypothesis is stationarity (the reverse of ADF). A small p-value is evidence *against* stationarity.
- Run both. Agreement (ADF rejects, KPSS does not) is strong evidence of stationarity. Disagreement usually means the series is trend-stationary or needs differencing.
- **Warning against over-differencing:** differencing more than necessary inflates variance and introduces artificial negative autocorrelation at lag 1. If the lag-1 autocorrelation of the differenced series is strongly negative (near -0.5) and the variance jumped, you have differenced too far.

## Autocorrelation: ACF and PACF

The autocorrelation structure is the fingerprint used to identify a model.

### Autocorrelation function (ACF)

The ACF at lag `k` is the correlation between `y_t` and `y_{t-k}`. Plotted against lag, it shows how far into the past the series "remembers." Values outside the approximate significance band `+/- 1.96 / sqrt(n)` are considered non-zero.

### Partial autocorrelation function (PACF)

The PACF at lag `k` is the correlation between `y_t` and `y_{t-k}` *after removing* the linear effect of the intervening lags `1 ... k-1`. It isolates the direct relationship at lag `k`.

### Reading the plots to identify an order

| Pattern | ACF | PACF | Suggested model |
|---|---|---|---|
| Autoregressive | Tails off (decays gradually) | Cuts off after lag `p` | AR(p) |
| Moving average | Cuts off after lag `q` | Tails off (decays gradually) | MA(q) |
| Mixed | Tails off | Tails off | ARMA(p, q) |

"Cuts off" means the spikes drop abruptly into the significance band; "tails off" means they decay (geometrically or in a damped sine wave). This ACF/PACF reading is the heart of model identification.

## AR, MA, ARMA, and ARIMA

### Autoregressive AR(p)

`y_t` is a linear function of its own `p` past values plus white noise:

`y_t = c + phi_1 * y_{t-1} + ... + phi_p * y_{t-p} + e_t`

The process "regresses on itself." Stationarity requires the roots of the characteristic polynomial to lie outside the unit circle (for AR(1), `|phi_1| < 1`).

### Moving average MA(q)

`y_t` is a linear function of the current and `q` past *shocks* (white-noise errors):

`y_t = c + e_t + theta_1 * e_{t-1} + ... + theta_q * e_{t-q}`

An MA process has memory of length exactly `q` -- its ACF cuts off after lag `q`.

### ARMA(p, q)

Combines both: `y_t` depends on its own past values *and* past errors. Compact and flexible for stationary series.

### ARIMA(p, d, q)

The **I** is "integrated": apply `d` regular differences to make the series stationary, then fit ARMA(p, q) to the differenced series. The three orders:

- **p** -- autoregressive order (from the PACF).
- **d** -- degree of differencing (to reach stationarity).
- **q** -- moving-average order (from the ACF).

ARIMA(0,1,0) is a random walk; ARIMA(0,1,1) is equivalent to simple exponential smoothing; ARIMA(0,2,2) corresponds to Holt's linear trend method.

## The Box-Jenkins Methodology

Box and Jenkins formalized model building as an iterative loop rather than a one-shot fit:

1. **Identification.** Transform for variance (log/Box-Cox), difference for stationarity (choose `d`), then read the ACF and PACF of the stationary series to propose candidate `(p, q)` orders.
2. **Estimation.** Fit the candidate models by maximum likelihood (or conditional least squares) to estimate the `phi` and `theta` coefficients.
3. **Diagnostic checking.** Examine the residuals: they must look like white noise. If they do not, return to step 1 with a revised model.
4. **Forecasting.** Once a model passes diagnostics, use it to forecast and quantify uncertainty.

**Model selection among candidates:** prefer the model with the lowest information criterion. AIC and BIC both trade goodness-of-fit against parameter count; BIC penalizes complexity more heavily and favors smaller models. The principle of parsimony applies -- a simpler model that passes diagnostics beats a more complex one that fits marginally better in-sample. This is Box's dictum that all models are wrong but some are useful: identify a model that is *useful* for forecasting, not one that perfectly explains the training data.

## Seasonality and SARIMA

Many series repeat on a fixed period `s` (12 for monthly data with an annual cycle, 4 for quarterly, 7 for daily-with-weekly). A plain ARIMA cannot capture that repetition efficiently.

### The SARIMA model

SARIMA(p, d, q)(P, D, Q)_s adds a seasonal set of terms:

- **(p, d, q)** -- the non-seasonal (short-lag) part.
- **(P, D, Q)** -- the seasonal part, operating at multiples of the period `s`.
- **s** -- the seasonal period.

`D` is the number of seasonal differences (`y_t - y_{t-s}`). Seasonal AR/MA terms model correlation at lags `s`, `2s`, `3s`, etc.

### Identifying seasonal orders

Read the ACF/PACF *at the seasonal lags*. A large spike at lag `s` (and `2s`) in the ACF that tails off suggests a seasonal MA term; a seasonal PACF cutoff suggests a seasonal AR term -- the same "cuts off vs. tails off" logic applied at multiples of `s`. Combine one seasonal difference with the seasonal ACF/PACF reading to pin down `(P, D, Q)`.

## Forecasting and Prediction Intervals

### Point forecasts

Once fitted, the model projects forward recursively: future values are predicted from past observed values and past estimated errors, feeding each new forecast back in. Differencing is undone (the forecasts are "integrated" back to the original scale).

### Prediction intervals

A point forecast without an interval is misleading -- it hides the uncertainty. A prediction interval gives a range expected to contain the actual future value with a stated probability (e.g., 95%).

- Intervals **widen as the horizon grows**: forecasting 1 step ahead is far more precise than 20 steps ahead, because errors compound.
- The standard formula assumes the residuals are Gaussian white noise; the interval is roughly `forecast +/- 1.96 * sigma_h`, where `sigma_h` (the forecast standard error) grows with the horizon `h`.
- When the normality assumption is doubtful, **bootstrap / simulation-based intervals** resample the residuals to build an empirical forecast distribution -- more robust for skewed or heavy-tailed errors.
- Prediction intervals are typically too narrow in practice because they ignore parameter-estimation uncertainty and the risk that the model itself is wrong. Treat them as a lower bound on true uncertainty.

## Diagnostics: Residual Analysis and the Ljung-Box Test

The core check: **if the model captured all the structure, the residuals should be indistinguishable from white noise** -- zero mean, constant variance, and no remaining autocorrelation.

### Residual checks

| Diagnostic | What it checks | Healthy result |
|---|---|---|
| Residual time plot | Mean and variance stability | Random scatter around zero, no trend or changing spread |
| Residual ACF | Leftover autocorrelation | All spikes inside the `+/- 1.96/sqrt(n)` band |
| Histogram / Q-Q plot | Normality of residuals | Roughly bell-shaped / points on the diagonal |

### The Ljung-Box test

Instead of eyeballing every lag of the residual ACF, the **Ljung-Box test** checks a *group* of autocorrelations jointly:

`Q = n(n+2) * sum_{k=1..h} [ r_k^2 / (n - k) ]`

where `r_k` is the residual autocorrelation at lag `k` and `h` is the number of lags tested. Under the null hypothesis "the residuals are white noise up to lag `h`," `Q` follows a chi-square distribution with `h - m` degrees of freedom (`m` = number of fitted ARMA parameters).

- **Large p-value (fail to reject):** good -- no evidence of leftover autocorrelation; the model is adequate.
- **Small p-value (reject):** bad -- structure remains in the residuals; go back to the Box-Jenkins identification step and revise `p`, `q`, or the seasonal orders.

The related **Box-Pierce** statistic is the older, less accurate version; Ljung-Box corrects its small-sample behavior and is the standard choice.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Fitting ARMA to a non-stationary series | AR/MA theory assumes stationarity; estimates are meaningless | Difference (and/or log) first; test with ADF and KPSS |
| Over-differencing | Inflates variance, adds spurious lag-1 negative autocorrelation | Use the smallest `d` that achieves stationarity |
| Ignoring seasonality | A seasonal spike remains in the residual ACF | Add seasonal differencing and SARIMA `(P, D, Q)_s` terms |
| Reporting a point forecast with no interval | Hides forecast uncertainty entirely | Always attach a prediction interval; expect it to widen with horizon |
| Skipping residual diagnostics | An inadequate model looks fine on in-sample fit but forecasts poorly | Run the Ljung-Box test and inspect the residual ACF |
| Choosing the model with the best in-sample fit | Overfitting; more parameters always fit training data better | Compare with AIC/BIC and favor the parsimonious model |
| Evaluating forecasts on the training data | Optimistic; the model has already seen those points | Hold out the most recent observations as a test set |

## Cross-References

- **box agent:** Box-Jenkins methodology, model identification, diagnostic checking, "all models are wrong."
- **efron agent:** Computational fitting, bootstrap and simulation-based prediction intervals, cross-validation for time series.
- **regression-modeling skill:** Autocorrelated residuals (residuals-vs-order plot) are the bridge from regression into time series.
- **descriptive-statistics skill:** Time plots and rolling summaries precede any formal model.
- **inferential-statistics skill:** The Ljung-Box and Dickey-Fuller tests are hypothesis tests applied to the time domain.

## References

- Box, G. E. P., Jenkins, G. M., Reinsel, G. C., & Ljung, G. M. (2015). *Time Series Analysis: Forecasting and Control*. 5th edition. Wiley.
- Hyndman, R. J., & Athanasopoulos, G. (2021). *Forecasting: Principles and Practice*. 3rd edition. OTexts.
- Shumway, R. H., & Stoffer, D. S. (2017). *Time Series Analysis and Its Applications*. 4th edition. Springer.
- Ljung, G. M., & Box, G. E. P. (1978). "On a measure of lack of fit in time series models." *Biometrika*, 65(2), 297-303.
- Brockwell, P. J., & Davis, R. A. (2016). *Introduction to Time Series and Forecasting*. 3rd edition. Springer.
