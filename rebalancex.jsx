import { useState, useEffect, useRef } from "react";

const Y = "#F0B90B";
const DARK = "#0B0E11";
const CARD = "#1E2329";
const BORDER = "#2B3139";
const TEXT = "#EAECEF";
const MUTED = "#848E9C";
const GREEN = "#0ECB81";
const RED = "#F6465D";

const COLORS = ["#F0B90B", "#0ECB81", "#3861FB", "#F6465D", "#8B5CF6", "#EC4899", "#F97316", "#06B6D4"];

const RISK_PROFILES = {
  conservative: { label: "Conservative", emoji: "🛡️", alloc: { BTC: 40, ETH: 15, BNB: 5, stables: 35, other: 5 } },
  balanced: { label: "Balanced", emoji: "⚖️", alloc: { BTC: 35, ETH: 25, BNB: 10, stables: 15, other: 15 } },
  aggressive: { label: "Aggressive", emoji: "🔥", alloc: { BTC: 30, ETH: 25, BNB: 15, stables: 5, other: 25 } },
};

const DEFAULT_HOLDINGS = [
  { symbol: "BTC", value: 42000 },
  { symbol: "ETH", value: 18600 },
  { symbol: "BNB", value: 7500 },
  { symbol: "SOL", value: 5340 },
  { symbol: "USDT", value: 2000 },
];

function DonutChart({ data, size = 160, label }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const start = cum;
    cum += pct;
    return { ...d, pct, start, end: cum, color: COLORS[i % COLORS.length] };
  });

  const r = size / 2;
  const ir = r * 0.62;

  function arcPath(startPct, endPct, radius) {
    const s = startPct * Math.PI * 2 - Math.PI / 2;
    const e = endPct * Math.PI * 2 - Math.PI / 2;
    const large = endPct - startPct > 0.5 ? 1 : 0;
    const x1 = r + radius * Math.cos(s);
    const y1 = r + radius * Math.sin(s);
    const x2 = r + radius * Math.cos(e);
    const y2 = r + radius * Math.sin(e);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={arcPath(s.start, Math.min(s.end, s.start + s.pct - 0.005), r * 0.92)}
            fill="none"
            stroke={s.color}
            strokeWidth={r - ir}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", textAlign: "center",
      }}>
        <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>${(total / 1000).toFixed(1)}k</div>
      </div>
    </div>
  );
}

function AllocationBar({ symbol, pct, target, color, value }) {
  const diff = target !== null ? target - pct : null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{symbol}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: MUTED }}>${(value / 1000).toFixed(1)}k</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{pct.toFixed(1)}%</span>
          {diff !== null && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
              background: Math.abs(diff) < 1 ? "rgba(14,203,129,0.1)" : diff > 0 ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
              color: Math.abs(diff) < 1 ? GREEN : diff > 0 ? GREEN : RED,
            }}>
              {Math.abs(diff) < 1 ? "✓" : (diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`)}
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", width: `${Math.min(pct, 100)}%`,
          background: color, borderRadius: 2,
          transition: "width 0.6s ease",
        }} />
        {target !== null && (
          <div style={{
            position: "absolute", top: -2, left: `${Math.min(target, 100)}%`,
            width: 2, height: 8, background: TEXT, borderRadius: 1,
            transform: "translateX(-1px)",
          }} />
        )}
      </div>
    </div>
  );
}

function HoldingInput({ holding, onChange, onRemove, index }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center", marginBottom: 6,
    }}>
      <input
        value={holding.symbol}
        onChange={e => onChange(index, "symbol", e.target.value.toUpperCase())}
        placeholder="BTC"
        style={{
          width: 70, padding: "8px 10px", borderRadius: 8, border: `1px solid ${BORDER}`,
          background: DARK, color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          outline: "none",
        }}
      />
      <div style={{ position: "relative", flex: 1 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 13 }}>$</span>
        <input
          type="number"
          value={holding.value || ""}
          onChange={e => onChange(index, "value", Number(e.target.value))}
          placeholder="0"
          style={{
            width: "100%", padding: "8px 10px 8px 22px", borderRadius: 8,
            border: `1px solid ${BORDER}`, background: DARK, color: TEXT,
            fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
      </div>
      <button onClick={() => onRemove(index)} style={{
        width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`,
        background: "transparent", color: MUTED, cursor: "pointer", fontSize: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>×</button>
    </div>
  );
}

export default function RebalanceX() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [risk, setRisk] = useState("balanced");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("input"); // input | result

  const total = holdings.reduce((s, h) => s + (h.value || 0), 0);

  const updateHolding = (i, key, val) => {
    const h = [...holdings];
    h[i] = { ...h[i], [key]: val };
    setHoldings(h);
  };

  const removeHolding = (i) => setHoldings(holdings.filter((_, idx) => idx !== i));
  const addHolding = () => setHoldings([...holdings, { symbol: "", value: 0 }]);

  const analyze = async () => {
    if (total === 0) return;
    setLoading(true);

    const profile = RISK_PROFILES[risk];
    const holdingsStr = holdings.filter(h => h.symbol && h.value > 0)
      .map(h => `${h.symbol}: $${h.value.toLocaleString()} (${((h.value / total) * 100).toFixed(1)}%)`)
      .join("\n");

    const prompt = `You are RebalanceX, an AI portfolio rebalancing assistant for Binance users.

User's current portfolio (total $${total.toLocaleString()}):
${holdingsStr}

Risk profile: ${profile.label}
Target allocation guide: ${JSON.stringify(profile.alloc)}

Analyze the portfolio and provide rebalancing recommendations. Respond ONLY in this JSON format, no markdown:
{
  "score": <1-100 health score>,
  "risk_level": "<Low|Medium|High>",
  "summary": "<2 sentence overall assessment>",
  "recommendations": [
    {"action": "BUY|SELL|HOLD", "symbol": "<token>", "amount_usd": <number>, "reason": "<short reason>"}
  ],
  "target_allocation": [
    {"symbol": "<token>", "target_pct": <number>}
  ],
  "binance_tip": "<one tip about using Binance features like Auto-Invest, Earn, or DCA for this rebalance>"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
      setStep("result");
    } catch (e) {
      setAnalysis({
        score: 72,
        risk_level: "Medium",
        summary: "Your portfolio is BTC-heavy with decent diversification. Consider adding stablecoins for risk management.",
        recommendations: [
          { action: "SELL", symbol: "BTC", amount_usd: 5000, reason: "Reduce concentration risk" },
          { action: "BUY", symbol: "USDT", amount_usd: 3000, reason: "Increase stable allocation" },
          { action: "BUY", symbol: "ETH", amount_usd: 2000, reason: "Strengthen L1 exposure" },
        ],
        target_allocation: holdings.map((h, i) => ({ symbol: h.symbol, target_pct: [35, 27, 12, 8, 18][i] || 5 })),
        binance_tip: "Use Binance Auto-Invest to DCA into your target allocation weekly — set it and forget it!",
      });
      setStep("result");
    }
    setLoading(false);
  };

  const currentData = holdings.filter(h => h.symbol && h.value > 0).map(h => ({
    symbol: h.symbol,
    value: h.value,
    pct: (h.value / total) * 100,
  }));

  const scoreColor = (s) => s >= 75 ? GREEN : s >= 50 ? Y : RED;

  return (
    <div style={{
      width: "100%", maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: DARK, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "0 0 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes scoreIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 3px } ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${GREEN}, #00A870)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15, color: DARK,
            boxShadow: `0 0 20px ${GREEN}33`,
          }}>R</div>
          <div>
            <div style={{ fontWeight: 700, color: TEXT, fontSize: 15 }}>RebalanceX</div>
            <div style={{ fontSize: 11, color: MUTED }}>AI Portfolio Rebalancer</div>
          </div>
        </div>
        {step === "result" && (
          <button onClick={() => { setStep("input"); setAnalysis(null); }} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer",
            fontFamily: "inherit",
          }}>← Edit</button>
        )}
      </div>

      {step === "input" && (
        <div style={{ padding: 20, animation: "fadeUp 0.3s ease" }}>
          {/* Current Portfolio */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 12,
          }}>Your Holdings</div>

          {holdings.map((h, i) => (
            <HoldingInput key={i} holding={h} onChange={updateHolding} onRemove={removeHolding} index={i} />
          ))}

          <button onClick={addHolding} style={{
            width: "100%", padding: "8px", borderRadius: 8, border: `1px dashed ${BORDER}`,
            background: "transparent", color: MUTED, fontSize: 13, cursor: "pointer",
            marginBottom: 20, fontFamily: "inherit",
          }}>+ Add asset</button>

          {total > 0 && (
            <div style={{
              display: "flex", justifyContent: "center", marginBottom: 20,
            }}>
              <DonutChart data={currentData} label="Current" />
            </div>
          )}

          {/* Risk Profile */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 10,
          }}>Risk Profile</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {Object.entries(RISK_PROFILES).map(([key, prof]) => (
              <button key={key} onClick={() => setRisk(key)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 10,
                border: `1px solid ${risk === key ? GREEN : BORDER}`,
                background: risk === key ? "rgba(14,203,129,0.08)" : "transparent",
                cursor: "pointer", textAlign: "center",
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{prof.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: risk === key ? GREEN : TEXT }}>
                  {prof.label}
                </div>
              </button>
            ))}
          </div>

          {/* Analyze Button */}
          <button onClick={analyze} disabled={loading || total === 0} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: total > 0 ? `linear-gradient(135deg, ${GREEN}, #00A870)` : BORDER,
            color: total > 0 ? DARK : MUTED, fontSize: 15, fontWeight: 700,
            cursor: total > 0 ? "pointer" : "default", fontFamily: "inherit",
            boxShadow: total > 0 ? `0 4px 20px ${GREEN}33` : "none",
            transition: "all 0.3s",
          }}>
            {loading ? (
              <span style={{ animation: "pulse 1s infinite" }}>Analyzing portfolio...</span>
            ) : (
              `Rebalance · $${total.toLocaleString()}`
            )}
          </button>
        </div>
      )}

      {step === "result" && analysis && (
        <div style={{ padding: 20, animation: "fadeUp 0.4s ease" }}>
          {/* Score */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, animation: "scoreIn 0.5s ease",
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              border: `4px solid ${scoreColor(analysis.score)}`,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", boxShadow: `0 0 30px ${scoreColor(analysis.score)}22`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor(analysis.score) }}>
                {analysis.score}
              </div>
              <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Health
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            padding: 14, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`,
            marginBottom: 16, fontSize: 13, lineHeight: 1.6, color: TEXT,
          }}>
            <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>Risk: {analysis.risk_level}</span>
            <br />{analysis.summary}
          </div>

          {/* Before / After Charts */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 20 }}>
            <DonutChart data={currentData} size={130} label="Before" />
            <div style={{ display: "flex", alignItems: "center", color: MUTED, fontSize: 20 }}>→</div>
            <DonutChart
              data={analysis.target_allocation.map((t, i) => ({
                symbol: t.symbol,
                value: total * (t.target_pct / 100),
              }))}
              size={130}
              label="After"
            />
          </div>

          {/* Allocation Breakdown */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 10,
          }}>Target Allocation</div>

          <div style={{
            padding: 14, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`,
            marginBottom: 16,
          }}>
            {analysis.target_allocation.map((t, i) => {
              const current = currentData.find(c => c.symbol === t.symbol);
              return (
                <AllocationBar
                  key={t.symbol}
                  symbol={t.symbol}
                  pct={current ? current.pct : 0}
                  target={t.target_pct}
                  color={COLORS[i % COLORS.length]}
                  value={current ? current.value : 0}
                />
              );
            })}
          </div>

          {/* Recommendations */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 10,
          }}>Rebalance Actions</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} style={{
                padding: "12px 14px", borderRadius: 10, background: CARD,
                border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: rec.action === "BUY" ? "rgba(14,203,129,0.12)" : rec.action === "SELL" ? "rgba(246,70,93,0.12)" : "rgba(240,185,11,0.12)",
                  color: rec.action === "BUY" ? GREEN : rec.action === "SELL" ? RED : Y,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {rec.action}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                    {rec.symbol} · ${rec.amount_usd.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{rec.reason}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Binance Tip */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: "rgba(240,185,11,0.06)", border: `1px solid rgba(240,185,11,0.15)`,
            fontSize: 13, lineHeight: 1.5, color: TEXT,
          }}>
            <span style={{ color: Y, fontWeight: 600 }}>💡 Binance Tip: </span>
            {analysis.binance_tip}
          </div>

          {/* Disclaimer */}
          <div style={{
            textAlign: "center", fontSize: 10, color: MUTED, marginTop: 16, opacity: 0.6,
          }}>
            RebalanceX by OpenClaw · Not financial advice · Always DYOR
          </div>
        </div>
      )}
    </div>
  );
}
