import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VermogenData, CryptoHolding, Schuld, VermogenSnapshot } from '../types';
import { formatEuro } from '../utils';
import { loadVermogen, saveVermogen } from '../storage';

export default function VermogenScreen() {
  const [data, setData] = useState<VermogenData>(() => loadVermogen());
  const [spaargeldInput, setSpaargeldInput] = useState(() =>
    data.spaargeld > 0 ? String(data.spaargeld) : ''
  );

  const [newCryptoName, setNewCryptoName] = useState('');
  const [newCryptoUsd, setNewCryptoUsd] = useState('');

  const [newSchuldName, setNewSchuldName] = useState('');
  const [newSchuldEur, setNewSchuldEur] = useState('');

  const [usdEur, setUsdEur] = useState<number | null>(null);
  const [rateError, setRateError] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((json) => {
        if (json.result === 'success') setUsdEur(json.rates.EUR);
        else setRateError(true);
      })
      .catch(() => setRateError(true));
  }, []);

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
    const amt = parseFloat(newCryptoUsd.replace(',', '.'));
    if (!newCryptoName.trim() || isNaN(amt) || amt <= 0) return;
    const holding: CryptoHolding = { id: uuidv4(), name: newCryptoName.trim(), amountUsd: amt };
    persist({ ...data, cryptoHoldings: [...data.cryptoHoldings, holding] });
    setNewCryptoName('');
    setNewCryptoUsd('');
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

  const totalCryptoUsd = data.cryptoHoldings.reduce((s, h) => s + h.amountUsd, 0);
  const totalCryptoEur = usdEur !== null ? totalCryptoUsd * usdEur : null;
  const totalSchulden = data.schulden.reduce((s, d) => s + d.amountEur, 0);
  const netWorth = totalCryptoEur !== null ? data.spaargeld + totalCryptoEur - totalSchulden : null;

  const saveSnapshot = () => {
    if (totalCryptoEur === null) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const label = now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    const snapshot: VermogenSnapshot = {
      monthKey,
      label,
      savedAt: now.toISOString(),
      spaargeld: data.spaargeld,
      cryptoEur: totalCryptoEur,
      schulden: totalSchulden,
      netWorth: data.spaargeld + totalCryptoEur - totalSchulden,
    };
    const history = [snapshot, ...data.history.filter((h) => h.monthKey !== monthKey)].sort(
      (a, b) => b.monthKey.localeCompare(a.monthKey)
    );
    persist({ ...data, history });
    setSavedMsg('Opgeslagen!');
    setTimeout(() => setSavedMsg(''), 2500);
  };

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

      {/* Crypto */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ ...cardTitle, marginBottom: 0, flex: 1 }}>₿ Crypto</span>
          {totalCryptoEur !== null && data.cryptoHoldings.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4A90E2' }}>
              {formatEuro(totalCryptoEur)}
            </span>
          )}
        </div>

        {data.cryptoHoldings.map((h) => (
          <div key={h.id} style={row}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{h.name}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                ${h.amountUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                {usdEur !== null && ` → ${formatEuro(h.amountUsd * usdEur)}`}
              </div>
            </div>
            <button onClick={() => removeCrypto(h.id)} style={deleteBtn}>✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input
            type="text"
            value={newCryptoName}
            onChange={(e) => setNewCryptoName(e.target.value)}
            placeholder="Naam (bijv. Bitcoin)"
            style={{ ...inlineInput, flex: 1.6 }}
          />
          <input
            type="number"
            inputMode="decimal"
            value={newCryptoUsd}
            onChange={(e) => setNewCryptoUsd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCrypto()}
            placeholder="$ bedrag"
            style={{ ...inlineInput, flex: 1 }}
          />
          <button onClick={addCrypto} style={addBtn}>+</button>
        </div>
        {rateError && (
          <div style={{ fontSize: 12, color: '#e55', marginTop: 8 }}>
            Kon wisselkoers niet ophalen. Controleer je verbinding.
          </div>
        )}
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
        disabled={totalCryptoEur === null}
        style={{
          width: '100%',
          background: totalCryptoEur !== null ? '#4A90E2' : '#ccc',
          color: '#fff', borderRadius: 12, padding: 16,
          fontSize: 16, fontWeight: 600, marginBottom: 16,
        }}
      >
        {savedMsg || '📸 Maandelijkse snapshot opslaan'}
      </button>

      {/* History */}
      {data.history.length > 0 && (
        <div style={card}>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', padding: 0 }}
          >
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#222', textAlign: 'left' }}>
              📈 Geschiedenis
            </span>
            <span style={{
              fontSize: 16, color: '#aaa',
              transform: historyOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}>▾</span>
          </button>

          {historyOpen && (
            <div style={{ marginTop: 12 }}>
              {data.history.map((snap, i) => (
                <div key={snap.monthKey} style={{
                  paddingTop: 12, paddingBottom: 12,
                  borderTop: i === 0 ? '1px solid #f0f0f0' : undefined,
                  borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333', textTransform: 'capitalize' }}>
                      {snap.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4A90E2' }}>
                      {formatEuro(snap.netWorth)}
                    </span>
                  </div>
                  {snap.savedAt && (
                    <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6 }}>
                      opgeslagen op {formatSavedAt(snap.savedAt)}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#999', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>Spaargeld: {formatEuro(snap.spaargeld)}</span>
                    <span>Crypto: {formatEuro(snap.cryptoEur)}</span>
                    <span>Schulden: {formatEuro(snap.schulden)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `${date} om ${time}`;
}

function BreakdownRow({
  label, value, color = '#333', bold, note,
}: {
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

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
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
