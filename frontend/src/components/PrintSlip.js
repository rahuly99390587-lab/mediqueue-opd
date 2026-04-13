import React, { useEffect } from 'react';

/**
 * PrintSlip — renders an isolated A4 slip that window.print() captures.
 *
 * HOW IT WORKS:
 *   1. This component writes into a <div class="mediqueue-print-area"> element.
 *   2. The CSS in index.html does:
 *        @media print {
 *          body > * { display: none }          ← hide entire React app
 *          .mediqueue-print-area { display:block } ← show ONLY this
 *        }
 *   3. We append the print div to document.body (outside the React tree)
 *      so it is never hidden by the admin layout's own hiding rules.
 *   4. On unmount we remove it.
 */

export default function PrintSlip({ visit, onClose }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    // Create isolated print container outside React tree
    const container = document.createElement('div');
    container.className = 'mediqueue-print-area';
    container.id = 'mediqueue-print-slot';
    document.body.appendChild(container);

    // Render HTML string into it
    container.innerHTML = buildSlipHTML(visit, today);

    return () => {
      // Cleanup on unmount
      const el = document.getElementById('mediqueue-print-slot');
      if (el) el.remove();
    };
  }, [visit, today]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-800 text-lg">Print Preview</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview summary */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">Token</span>
              <span className="font-mono font-bold text-xl leading-none">{visit?.token_no}</span>
            </div>
            <div>
              <p className="font-display font-bold text-slate-800">{visit?.name}</p>
              <p className="text-sm text-slate-500">Age: {visit?.age} yrs &bull; {visit?.mobile}</p>
              <p className="text-xs text-slate-400 mt-1">{visit?.visit_date}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-slate-500 mb-4">
            The A4 slip will be sent to your printer. Make sure the slip content is correct before printing.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
            >
              🖨️ Print Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSlipHTML(visit, today) {
  const diagnosis = visit?.diagnosis || '';
  const medicines = visit?.medicines || '';
  const notes     = visit?.notes || '';
  const nextVisit = visit?.expiry_date
    ? new Date(visit.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  // Helper: draw blank lines if empty
  const field = (val, lines = 1) => {
    if (val?.trim()) return `<span style="font-weight:600">${val}</span>`;
    return Array(lines).fill('<div style="border-bottom:1px solid #999;height:20px;margin-bottom:4px"></div>').join('');
  };

  return `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:190mm;margin:0 auto;color:#000;font-size:11pt;line-height:1.5">

      <!-- HEADER -->
      <div style="text-align:center;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:12px">
        <div style="font-size:22pt;font-weight:900;letter-spacing:-0.5px;font-family:'Outfit',sans-serif">MediQueue Hospital</div>
        <div style="font-size:10pt;color:#444;margin-top:2px">OPD Outpatient Department · Patient Visit Slip</div>
        <div style="font-size:9pt;color:#666;margin-top:2px">Powered by MediQueue OPD System</div>
      </div>

      <!-- TOKEN + DATE ROW -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;border:2px solid #000;border-radius:6px">
        <div>
          <div style="font-size:9pt;color:#555;font-weight:600;letter-spacing:1.5px;text-transform:uppercase">Token Number</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:48pt;font-weight:700;line-height:1;letter-spacing:-2px">${visit?.token_no || 'T-?'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9pt;color:#555;font-weight:600">Visit Date</div>
          <div style="font-size:12pt;font-weight:700;margin-top:2px">${visit?.visit_date || today}</div>
          <div style="margin-top:6px;padding:4px 10px;background:#000;color:#fff;border-radius:4px;font-size:9pt;font-weight:600;display:inline-block;text-transform:uppercase">${(visit?.status || 'waiting').toUpperCase()}</div>
        </div>
      </div>

      <!-- PATIENT DETAILS -->
      <div style="border:1.5px solid #ccc;border-radius:4px;padding:12px;margin-bottom:12px">
        <div style="font-size:9pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#444;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px">Patient Details</div>
        <table style="width:100%;border-collapse:collapse;font-size:10.5pt">
          <tr>
            <td style="width:28%;color:#555;padding:3px 0;vertical-align:top">Full Name</td>
            <td style="font-weight:700;padding:3px 0">${visit?.name || '—'}</td>
            <td style="width:20%;color:#555;padding:3px 0;text-align:right">Age</td>
            <td style="font-weight:600;padding:3px 0;text-align:right">${visit?.age ? visit.age + ' yrs' : '—'}</td>
          </tr>
          <tr>
            <td style="color:#555;padding:3px 0;vertical-align:top">Mobile</td>
            <td style="font-weight:600;padding:3px 0;font-family:monospace">${visit?.mobile || '—'}</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td style="color:#555;padding:3px 0;vertical-align:top">Address</td>
            <td colspan="3" style="padding:3px 0">${visit?.address || '—'}</td>
          </tr>
        </table>
      </div>

      <!-- COMPLAINT -->
      <div style="border:1.5px solid #ccc;border-radius:4px;padding:12px;margin-bottom:12px">
        <div style="font-size:9pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#444;margin-bottom:8px">Chief Complaint / Problem</div>
        <div style="font-size:11pt;line-height:1.6">${visit?.problem || '<span style="color:#999">Not recorded</span>'}</div>
      </div>

      <!-- DOCTOR PRESCRIPTION -->
      <div style="border:2px solid #000;border-radius:4px;padding:14px;margin-bottom:14px;background:#fcfcfc">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;border-bottom:1.5px solid #000;padding-bottom:8px">
          <span style="font-size:18pt;font-weight:900;font-style:italic">℞</span>
          <span style="font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Doctor's Prescription</span>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:9pt;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px">Diagnosis</div>
          ${field(diagnosis, 2)}
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:9pt;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px">Medicines & Dosage</div>
          ${medicines.trim()
            ? `<div style="white-space:pre-wrap;font-size:11pt;line-height:1.8">${medicines}</div>`
            : `${field('', 1)}${field('', 1)}${field('', 1)}${field('', 1)}`
          }
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:9pt;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px">Instructions / Notes</div>
          ${field(notes, 2)}
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px dashed #ccc">
          <div>
            <div style="font-size:9pt;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px">Next Visit Date</div>
            ${nextVisit
              ? `<div style="font-size:12pt;font-weight:700;border:1.5px solid #000;padding:4px 12px;border-radius:4px;display:inline-block">${nextVisit}</div>`
              : `<div style="border-bottom:1px solid #999;width:140px;height:22px"></div>`
            }
          </div>
          <div style="text-align:center">
            <div style="border-bottom:1px solid #000;width:160px;height:40px;margin-bottom:4px"></div>
            <div style="font-size:9pt;color:#555">Doctor's Signature & Stamp</div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="display:flex;justify-content:space-between;font-size:8.5pt;color:#888;border-top:1px solid #ddd;padding-top:6px">
        <span>MediQueue OPD System · Visit ID: ${visit?.id || '—'}</span>
        <span>Generated: ${new Date().toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
}
