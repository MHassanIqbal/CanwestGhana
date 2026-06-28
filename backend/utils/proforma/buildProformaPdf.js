import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// ── colours & layout constants ─────────────────────────────────────────────
const BRAND = "#1a3c5e"; // dark navy — prominent header block
const ACCENT = "#e8f0f7"; // light blue — table header bg / structural accents
const MUTED = "#6b7280"; // grey — labels, secondary text
const BLACK = "#111827";
const RED = "#b91c1c"; // "EXPIRED" stamp
const BORDER_COLOR = "#d1d5db"; // light grid lines

const PAGE = {
  size: "A4",
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
};
const COL_W = 515; // 595 (A4 width) - 40 - 40

// ── currency formatter ──────────────────────────────────────────────────────
const ghc = (n) =>
  `GHC ${Number(n ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Fill background helper */
const fillRect = (doc, x, y, w, h, colour) => {
  doc.save().rect(x, y, w, h).fill(colour).restore();
};

/** Thin horizontal rule */
const hRule = (doc, y, colour = BORDER_COLOR, lineWidth = 0.5) => {
  doc
    .save()
    .moveTo(40, y)
    .lineTo(555, y)
    .lineWidth(lineWidth)
    .stroke(colour)
    .restore();
};

/** Helper to fetch external image buffer safely for PDFKit */
const fetchImageBuffer = async (url) => {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch image: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Builds a strictly balanced, prominent structured A4 Proforma PDF
 */
export const buildProformaPdf = (proforma, company) =>
  new Promise(async (resolve, reject) => {
    const doc = new PDFDocument(PAGE);
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      // ── Pre-fetch Assets Parallelized ─────────────────────────────────────
      const qrUrl = `${process.env.FRONTEND_WORKPLACE_URL ?? "https://app.canwestghana.com"}/verify/${proforma.verificationToken}`;

      const [qrBuffer, logoBuffer] = await Promise.all([
        QRCode.toBuffer(qrUrl, {
          margin: 0,
          width: 140,
          color: { dark: "#111827", light: "#FFFFFF" },
        }),
        fetchImageBuffer(company?.logoUrl).catch(() => null), // Fallback gracefully on image download errors
      ]);

      // ── 1. Header Section (~11% height block) ─────────────────────────────
      let y = 40;
      const headerHeight = 115; // Expanded block height for larger brand footprint

      // Prominent background wrapper block
      fillRect(doc, 40, y, COL_W, headerHeight, BRAND);

      // ── LEFT COLUMN: Company Profile Stack ──
      const compX = 55;
      let compY = y + 15;

      // ── ROW 1: Dominant Brand Identity (Logo matches Name + Slogan Height) ──
      let textOffsetX = compX;
      const row1Height = 36; // Exact combined height of Name (22px) + Slogan (14px)

      if (logoBuffer) {
        // Logo is forced to exactly match the 36px text baseline block height
        doc.image(logoBuffer, compX, compY, { height: row1Height });
        textOffsetX += 44; // Tighter horizontal space between logo and text panel
      }

      // Largest Header element: Primary Company Brand Name
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text(company?.companyName ?? "Canwest Ghana", textOffsetX, compY - 1, {
          width: 260,
        });

      // Slogan sitting directly inside the 36px vertical box boundary
      if (company?.slogan) {
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#cbd5e1")
          .text(`"${company.slogan}"`, textOffsetX, compY + 22, { width: 260 });
      }

      // Increased vertical breathing space between Row 1 and Row 2
      compY += row1Height + 22;

      // ── ROW 2 & 3: Clean Contact & Location Info ──

      // Phone & Email Row
      const contactRowText = [
        company?.contactPhone ? `Tel: ${company.contactPhone}` : null,
        company?.contactEmail ? `Email: ${company.contactEmail}` : null,
      ]
        .filter(Boolean)
        .join("   |   ");

      if (contactRowText) {
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor("#e2e8f0")
          .text(contactRowText, compX, compY, { width: 280 });
        compY += 14;
      }

      // Physical Location Row
      if (company?.address) {
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor("#e2e8f0")
          .text(`Address: ${company.address}`, compX, compY, { width: 280 });
      }

      // ── RIGHT COLUMN: Document Title (Vertically Centered Against Full Header) ──
      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text("PROFORMA INVOICE", 330, y + 48, { width: 210, align: "right" });

      y += headerHeight + 20;

      // ── 2. Sub-header Section (~14% height block) ─────────────────────────
      const issuedDate = proforma.issuedAt
        ? new Date(proforma.issuedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date(proforma.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

      const senderName = proforma.sender
        ? `${proforma.sender.firstName} ${proforma.sender.lastName}`
        : "—";

      // Left column: Bill To Info
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(BRAND)
        .text("Bill To:", 40, y);

      let leftY = y + 16;
      const cs = proforma.customerSnapshot || {};
      const customerLines = [
        cs.name,
        cs.address,
        cs.city,
        cs.email,
        cs.phone,
        cs.tin ? `TIN: ${cs.tin}` : null,
      ].filter(Boolean);

      doc.fontSize(8.5).font("Helvetica").fillColor(BLACK);
      customerLines.forEach((line) => {
        doc.text(line, 40, leftY, { width: 240 });
        leftY += 13;
      });

      // Right column: Metadata details
      let rightY = y + 4;
      const metaXLabel = 360;
      const metaXVal = 445;

      const metaRows = [
        ["Proforma No:", proforma.proformaNumber ?? "—"],
        ["Issued On:", issuedDate],
        ["Issued By:", senderName],
      ];

      metaRows.forEach(([label, val]) => {
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(MUTED)
          .text(label, metaXLabel, rightY);
        doc
          .font("Helvetica-Bold")
          .fillColor(BLACK)
          .text(val, metaXVal, rightY, { width: 110, align: "right" });
        rightY += 15;
      });

      y = Math.max(leftY, rightY) + 20;

      // ── 3. Main Content / Optimized Table Structure ───────────────────────
      const COLS = {
        idx: { x: 40, w: 35 },
        desc: { x: 75, w: 240 },
        qty: { x: 315, w: 40 },
        unit: { x: 355, w: 95 },
        total: { x: 450, w: 105 },
      };

      const tableHeaderHeight = 24;
      fillRect(doc, 40, y, COL_W, tableHeaderHeight, ACCENT);

      doc
        .save()
        .moveTo(40, y + tableHeaderHeight)
        .lineTo(555, y + tableHeaderHeight)
        .lineWidth(1)
        .stroke(BRAND)
        .restore();

      const headers = [
        ["#", COLS.idx, "left"],
        ["Description", COLS.desc, "left"],
        ["Qty", COLS.qty, "right"],
        ["Unit Price", COLS.unit, "right"],
        ["Total Price", COLS.total, "right"],
      ];

      headers.forEach(([label, col, align]) => {
        doc
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .fillColor(BRAND)
          .text(label, col.x + (align === "right" ? 0 : 6), y + 7, {
            width: col.w - (align === "right" ? 6 : 0),
            align,
          });
      });

      y += tableHeaderHeight;

      (proforma.lineItems || []).forEach((item, idx) => {
        const descText = item.productSnapshot?.name ?? "";

        const measuredH = doc.heightOfString(descText, {
          width: COLS.desc.w - 12,
          fontSize: 8.5,
        });
        const rowH = Math.max(24, measuredH + 12);

        if (idx % 2 === 1) {
          fillRect(doc, 40, y, COL_W, rowH, "#f9fafb");
        }

        doc
          .save()
          .moveTo(40, y + rowH)
          .lineTo(555, y + rowH)
          .lineWidth(0.5)
          .stroke("#e5e7eb")
          .restore();

        doc.fontSize(8.5).font("Helvetica").fillColor(BLACK);
        doc.text(String(idx + 1), COLS.idx.x + 6, y + 8, {
          width: COLS.idx.w - 6,
        });
        doc.text(descText, COLS.desc.x + 6, y + 8, { width: COLS.desc.w - 12 });
        doc.text(String(item.quantity), COLS.qty.x, y + 8, {
          width: COLS.qty.w - 6,
          align: "right",
        });
        doc.text(ghc(item.unitPriceGhs), COLS.unit.x, y + 8, {
          width: COLS.unit.w - 6,
          align: "right",
        });
        doc.text(ghc(item.totalGhs), COLS.total.x, y + 8, {
          width: COLS.total.w - 6,
          align: "right",
        });

        y += rowH;
      });

      y += 15;

      // Sub-totals calculations summary
      const totalsX = 350;
      const valX = 445;

      const totalsRows = [
        ["Subtotal", ghc(proforma.subtotalGhs), false],
        proforma.discountGhs > 0
          ? ["Discount", `- ${ghc(proforma.discountGhs)}`, false]
          : null,
        proforma.taxPercent > 0
          ? [`Tax (${proforma.taxPercent}%)`, ghc(proforma.taxGhs), false]
          : null,
        ["Total", ghc(proforma.totalGhs), true],
      ].filter(Boolean);

      totalsRows.forEach(([label, val, isBold]) => {
        const blockH = 18;
        if (isBold) {
          fillRect(doc, totalsX - 5, y, COL_W - (totalsX - 45), blockH, ACCENT);
          doc.fontSize(9.5).font("Helvetica-Bold").fillColor(BRAND);
        } else {
          doc.fontSize(8.5).font("Helvetica").fillColor(MUTED);
        }
        doc.text(label, totalsX, y + 4);
        doc
          .fillColor(isBold ? BRAND : BLACK)
          .text(val, valX, y + 4, { width: COLS.total.w - 5, align: "right" });
        y += blockH + 2;
      });

      // ── 4. Footer Section (~15% height pinned block layout) ───────────────
      const footerTopY = 705;
      hRule(doc, footerTopY - 10, BRAND, 1);

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(BRAND)
        .text("Notes & Terms:", 40, footerTopY);

      // Priority implementation of defaultTerms data if populated, else fallback
      const businessNotes = company?.defaultTerms
        ? company.defaultTerms.split("\n").filter(Boolean).slice(0, 5)
        : [
            "1. All items supplied remain company property until outstanding payments clear.",
            "2. Please check and match descriptions; payments must reference the document number.",
            "3. Standard delivery processing schedules commence post physical receipt of payment.",
            "4. Prices are inclusive of default country statutory taxation models where applicable.",
          ];

      let noteItemY = footerTopY + 14;
      doc.fontSize(7.5).font("Helvetica").fillColor(MUTED);
      businessNotes.forEach((note) => {
        doc.text(note, 40, noteItemY, { width: 370 });
        noteItemY += 12;
      });

      // QR Code
      const qrDim = 65;
      const qrX = 555 - qrDim;

      doc.image(qrBuffer, qrX, footerTopY + 2, { width: qrDim, height: qrDim });

      doc
        .fontSize(6.5)
        .font("Helvetica-Oblique")
        .fillColor(MUTED)
        .text(
          "Scan code securely\nto verify validity.",
          qrX - 55,
          footerTopY + 20,
          { width: 50, align: "right" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
