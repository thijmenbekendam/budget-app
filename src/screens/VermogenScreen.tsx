import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VermogenData, CryptoHolding, Schuld, VermogenSnapshot } from '../types';
import { formatEuro } from '../utils';
import { loadVermogen, saveVermogen } from '../storage';
import NetWorthChart from '../components/NetWorthChart';

// Maps common ticker symbols to CoinGecko coin IDs
const TICKER_TO_ID: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple',
  SOL: 'solana', ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot',
  MATIC: 'matic-network', LINK: 'chainlink', AVAX: 'avalanche-2',
  SHIB: 'shiba-inu', LTC: 'litecoin', UNI: 'uniswap', ATOM: 'cosmos',
  XLM: 'stellar', ALGO: 'algorand', VET: 'vechain', TRX: 'tron',
  ETC: 'ethereum-classic', XMR: 'monero', BCH: 'bitcoin-cash',
  NEAR: 'near', ICP: 'internet-computer', APT: 'aptos',
  ARB: 'arbitrum', OP: 'optimism', TON: 'the-open-network',
  SUI: 'sui', PEPE: 'pepe', WLD: 'worldcoin-wld',
};

export default function VermogenScreen() {
  const [data, setData] = useState<VermogenData>(() => loadVermogen());
  const [spaargeldInput, setSpaargeldInput] = useState(() =>
    data.spaargeld > 0 ? String(data.spaargeld) : ''
  );

  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const [newSchuldName, setNewSchuldName] = useState('');
  const [newSchuldEur, setNewSchuldEur] = useState('');

  const [usdEur, setUsdEur] = useState<number | null>(null);
  const [rateError, setRateError] = useState(false);

  // coinId -> USD price
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  const [expandedSnaps, setExpandedSnaps] = useState<Set<string>>(new Set());
  const [savedMsg, setSavedMsg] = useState('');

  const fetchPrices = (holdings: CryptoHolding[]) => {
    const ids = [...new Set(holdings.map((h) => h.coinId))];
    if (ids.length === 0) return;
    setPricesLoading(true);
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)
      .then((r) => r.json())
      .then((json) => {
        const p: Record<string, number> = {};
        for (const id of ids) {
          if (json[id]?.usd != null) p[id] = json[id].usd;
        }
        setPrices((prev) => ({ ...prev, ...p }));
      })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  };

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((json) => {
        if (json.result === 'success') setUsdEur(json.rates.EUR);
        else setRateError(true);
      })
      .catch(() => setRateError(true));

    fetchPrices(data.cryptoHoldings);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next: VermogenData) => {
    setData(next);
    saveVermogen(next);
  };

  const handleSpaargeldBlur = () => {
    const val = parseFloat(spaargeldInput.replace(',', '.'));
    const finalVal = !isNaN(val) && val >= 0 ? val : data.spaargeld;
    persist({ ...data, spaargeld: finalVal });
    setSpaargeldInput(finalVal > 0 ? String(finalVal) : '');
  };

  const addCrypto = () => {
    const amt = parseFloat(newAmount.replace(',', '.'));
    if (!newName.trim() || !newSymbol.trim() || isNaN(amt) || amt <= 0) return;
    const sym = newSymbol.trim().toUpperCase();
    const coinId = TICKER_TO_ID[sym] ?? sym.toLowerCase();
    const holding: CryptoHolding = { id: uuidv4(), name: newName.trim(), symbol: sym, amount: amt, coinId };
    const next = { ...data, cryptoHoldings: [...data.cryptoHoldings, holding] };
    persist(next);
    fetchPrices(next.cryptoHoldings);
    setNewName('');
    setNewSymbol('');
    setNewAmount('');
  };

  const removeCrypto = (id: string) =>
    persist({ ...data, cryptoHoldings: data.cryptoHoldings.filter((h) => h.id !== id) });

  const addSchuld = () => {
    const amt = parseFloat(newSchuldEur.replace(',', '.'));
    if (!newSchuldName.trim() || isNaN(amt) || amt <= 0) return;
    const schuld: Schuld = { id: uuidv4(), name: newSchuldName.trim(), amountEur: amt };
    persist({ ...data, schulden: [...data.schulden, schuld] });
    setNewSchuldName('');
    setNewSchuldEur('');
  };

  const removeSchuld = (id: string) =>
    persist({ ...data, schulden: data.schulden.filter((s) => s.id !== id) });

  // Per-holding computed values
  const holdingValues = data.cryptoHoldings.map((h) => {
    const usdPrice = prices[h.coinId];
    const usdValue = usdPrice != null ? h.amount * usdPrice : null;
    const eurValue = usdValue != null && usdEur != null ? usdValue * usdEur : null;
    return { ...h, usdPrice, usdValue, eurValue };
  });

  const totalCryptoUsd = holdingValues.every((h) => h.usdValue != null)
    ? holdingValues.reduce((s, h) => s + (h.usdValue ?? 0), 0)
    : null;
  const totalCryptoEur = totalCryptoUsd != null && usdEur != null ? totalCryptoUsd * usdEur : null;
  const totalSchulden = data.schulden.reduce((s, d) => s + d.amountEur, 0);
  const netWorth = totalCryptoEur != null ? data.spaargeld + totalCryptoEur - totalSchulden : null;

  const canSnapshot = usdEur != null;

  const saveSnapshot = () => {
    if (!canSnapshot) return;
    const cryptoUsd = holdingValues.reduce((s, h) => s + (h.usdValue ?? 0), 0);
    const cryptoEur = cryptoUsd * usdEur!;
    const now = new Date();
    const id = uuidv4();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const label = now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    const snapshot: VermogenSnapshot = {
      id, monthKey, label,
      savedAt: now.toISOString(),
      spaargeld: data.spaargeld,
      cryptoUsd: cryptoUsd,
      cryptoEur: cryptoEur,
      schulden: totalSchulden,
      netWorth: data.spaargeld + cryptoEur - totalSchulden,
    };
    const history = [snapshot, ...data.history].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    persist({ ...data, history });
    setExpandedSnaps((prev) => new Set(prev).add(id));
    setSavedMsg('Opgeslagen!');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const deleteSnapshot = (id: string) => {
    persist({ ...data, history: data.history.filter((s) => s.id !== id) });
    setExpandedSnaps((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const toggleSnap = (id: string) =>
    setExpandedSnaps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div style={{ padding: 16, paddingBottom: 32 }}>
      {/* Net worth card */}
      <div style={{
        background: '#4A90E2', borderRadius: 16, padding: 24,
        marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Netto vermogen</span>
        <span style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginTop: 4 }}>
          {netWorth !== null ? formatEuro(netWorth) : '…'}
        </span>
        {usdEur !== null && (
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 }}>
            Wisselkoers: 1 USD = {formatEuro(usdEur)}
          </span>
        )}
        {rateError && (
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 }}>
            Wisselkoers niet beschikbaar
          </span>
        )}
      </div>

      {/* Spaargeld */}
      <div style={card}>
        <span style={cardTitle}>💰 Spaargeld</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, color: '#555' }}>€</span>
          <input
            type="number"
            inputMode="decimal"
            value={spaargeldInput}
            onChange={(e) => setSpaargeldInput(e.target.value)}
            onBlur={handleSpaargeldBlur}
            placeholder="0,00"
            style={fullInput}
          />
        </div>
      </div>

      {/* Crypto portfolio */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: holdingValues.length > 0 ? 4 : 12 }}>
          <span style={{ ...cardTitle, marginBottom: 0, flex: 1 }}>₿ Crypto</span>
          {pricesLoading && (
            <span style={{ fontSize: 11, color: '#bbb', marginRight: 8 }}>laden…</span>
          )}
          {totalCryptoEur !== null && holdingValues.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4A90E2' }}>
              {formatEuro(totalCryptoEur)}
            </span>
          )}
        </div>

        {holdingValues.map((h) => (
          <div key={h.id} style={row}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{h.name}</span>
                <span style={{
                  background: '#eef3fb', color: '#4A90E2',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                }}>{h.symbol}</span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
                {fmtQty(h.amount)} {h.symbol}
                {h.usdValue != null
                  ? ` · $${h.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : pricesLoading ? ' · …' : ' · prijs onbekend'}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 10, flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                {h.eurValue != null ? formatEuro(h.eurValue) : (pricesLoading ? '…' : '–')}
              </div>
            </div>
            <button onClick={() => removeCrypto(h.id)} style={deleteBtn}>✕</button>
          </div>
        ))}

        {/* Total row when multiple coins */}
        {holdingValues.length > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 10, marginTop: 4, borderTop: '1px solid #f0f0f0',
          }}>
            <span style={{ fontSize: 13, color: '#999' }}>Totaal crypto</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4A90E2' }}>
              {totalCryptoEur != null ? formatEuro(totalCryptoEur) : '…'}
            </span>
          </div>
        )}

        {/* Add form */}
        <div style={{ marginTop: 14 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Naam (bijv. Bitcoin)"
            style={{ ...inlineInput, width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="BTC"
              maxLength={10}
              style={{ ...inlineInput, flex: 1, minWidth: 0 }}
            />
            <input
              type="number"
              inputMode="decimal"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCrypto()}
              placeholder="Hoeveelheid"
              style={{ ...inlineInput, flex: 2, minWidth: 0 }}
            />
            <button onClick={addCrypto} style={addBtn}>+</button>
          </div>
        </div>
      </div>

      {/* Schulden */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ ...cardTitle, marginBottom: 0, flex: 1 }}>💸 Schulden</span>
          {data.schulden.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e55' }}>
              {formatEuro(totalSchulden)}
            </span>
          )}
        </div>

        {data.schulden.map((s) => (
          <div key={s.id} style={row}>
            <span style={{ flex: 1, fontSize: 14, color: '#333' }}>{s.name}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e55', marginRight: 12 }}>
              {formatEuro(s.amountEur)}
            </span>
            <button onClick={() => removeSchuld(s.id)} style={deleteBtn}>✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input
            type="text"
            value={newSchuldName}
            onChange={(e) => setNewSchuldName(e.target.value)}
            placeholder="Naam schuld"
            style={{ ...inlineInput, flex: 1.6 }}
          />
          <input
            type="number"
            inputMode="decimal"
            value={newSchuldEur}
            onChange={(e) => setNewSchuldEur(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSchuld()}
            placeholder="€ bedrag"
            style={{ ...inlineInput, flex: 1 }}
          />
          <button onClick={addSchuld} style={addBtn}>+</button>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ ...card, background: '#f0f4fb' }}>
        <BreakdownRow label="Spaargeld" value={data.spaargeld} />
        <BreakdownRow label="Crypto" value={totalCryptoEur ?? 0} note={totalCryptoEur === null ? '…' : undefined} />
        <BreakdownRow label="Schulden" value={-totalSchulden} color="#e55" />
        <div style={{ height: 1, background: '#d0d8e8', margin: '8px 0' }} />
        <BreakdownRow label="Netto vermogen" value={netWorth ?? 0} color="#4A90E2" bold note={netWorth === null ? '…' : undefined} />
      </div>

      {/* Save snapshot */}
      <button
        onClick={saveSnapshot}
        disabled={!canSnapshot}
        style={{
          width: '100%',
          background: canSnapshot ? '#4A90E2' : '#ccc',
          color: '#fff', borderRadius: 12, padding: 16,
          fontSize: 16, fontWeight: 600, marginBottom: 16,
        }}
      >
        {savedMsg || '📸 Maandelijkse snapshot opslaan'}
      </button>

      {/* Net worth chart */}
      {data.history.length > 0 && (
        <div style={{ ...card, marginBottom: 16 }}>
          <span style={{ ...cardTitle, marginBottom: 16 }}>📈 Vermogen over tijd</span>
          <NetWorthChart snapshots={data.history} />
        </div>
      )}

      {/* History */}
      {data.history.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 10 }}>
            Geschiedenis
          </div>
          {data.history.map((snap) => {
            const open = expandedSnaps.has(snap.id);
            return (
              <div key={snap.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => toggleSnap(snap.id)}
                    style={{ display: 'flex', alignItems: 'center', flex: 1, background: 'none', padding: 0, textAlign: 'left' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#222', textTransform: 'capitalize' }}>
                        {snap.label}
                      </div>
                      {snap.savedAt && (
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                          opgeslagen op {formatSavedAt(snap.savedAt)}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#4A90E2', marginRight: 8 }}>
                      {formatEuro(snap.netWorth)}
                    </span>
                    <span style={{
                      fontSize: 14, color: '#aaa',
                      transform: open ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0, marginRight: 8,
                    }}>▾</span>
                  </button>
                  <button
                    onClick={() => deleteSnapshot(snap.id)}
                    style={{ color: '#ddd', fontSize: 16, padding: '4px 2px', flexShrink: 0 }}
                  >✕</button>
                </div>

                {open && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ height: 1, background: '#f0f0f0', marginBottom: 12 }} />
                    <DetailRow label="💰 Spaargeld" value={formatEuro(snap.spaargeld)} />
                    <DetailRow
                      label="₿ Crypto"
                      value={formatEuro(snap.cryptoEur)}
                      sub={snap.cryptoUsd != null
                        ? `$${snap.cryptoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : undefined}
                    />
                    <DetailRow label="💸 Schulden" value={formatEuro(snap.schulden)} valueColor="#e55" />
                    <div style={{ height: 1, background: '#f0f0f0', margin: '10px 0' }} />
                    <DetailRow label="Netto vermogen" value={formatEuro(snap.netWorth)} valueColor="#4A90E2" bold />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function fmtQty(n: number): string {
  if (n >= 1000) return n.toLocaleString('nl-NL', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString('nl-NL', { maximumFractionDigits: 4 });
  return n.toLocaleString('nl-NL', { maximumSignificantDigits: 4 });
}

function DetailRow({ label, value, sub, valueColor = '#333', bold }: {
  label: string; value: string; sub?: string; valueColor?: string; bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 5, paddingBottom: 5 }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, color: '#555', fontWeight: bold ? 600 : 400 }}>{label}</span>
        {sub && <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 600, color: valueColor }}>{value}</span>
    </div>
  );
}

function BreakdownRow({ label, value, color = '#333', bold, note }: {
  label: string; value: number; color?: string; bold?: boolean; note?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 5 }}>
      <span style={{ fontSize: 14, color: '#555', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 600, color }}>
        {note ?? formatEuro(value)}
      </span>
    </div>
  );
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `${date} om ${time}`;
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
};

const cardTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#222',
  marginBottom: 12,
  display: 'block',
};

const fullInput: React.CSSProperties = {
  background: '#f5f5f5',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 16,
  color: '#333',
  border: '1px solid #e0e0e0',
  flex: 1,
};

const inlineInput: React.CSSProperties = {
  background: '#f5f5f5',
  borderRadius: 8,
  padding: '10px 10px',
  fontSize: 13,
  color: '#333',
  border: '1px solid #e0e0e0',
  minWidth: 0,
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 8,
  borderBottom: '1px solid #f5f5f5',
};

const deleteBtn: React.CSSProperties = {
  color: '#ccc',
  fontSize: 16,
  padding: 4,
  flexShrink: 0,
};

const addBtn: React.CSSProperties = {
  background: '#4A90E2',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 18,
  fontWeight: 700,
  flexShrink: 0,
};
