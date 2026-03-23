import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Mercanto <noreply@mercanto.pe>";

export async function sendEmail(to: string, subject: string, html: string) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to:", to);
    return;
  }
  try {
    await client.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://mercanto.pe";
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#f97316;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">¡Bienvenido a Mercanto!</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#444">Ya eres parte de la comunidad de tu barrio. Ahora puedes explorar tiendas cercanas, ver sus productos y contactar a los vendedores directamente.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${frontendUrl}" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Explorar tiendas</a>
        </div>
        <p style="font-size:13px;color:#999;margin-top:32px">Si no creaste esta cuenta, ignora este mensaje.</p>
      </div>
    </div>`;
  await sendEmail(to, "¡Bienvenido a Mercanto! 🎉", html);
}

export async function sendStoreApprovedEmail(to: string, ownerName: string, storeName: string, storeSlug: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://mercanto.pe";
  const storeUrl = `${frontendUrl}/stores/${storeSlug}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#16a34a;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">¡Tu tienda fue aprobada!</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${ownerName}</strong>,</p>
        <p style="font-size:15px;color:#444">Tu tienda <strong>${storeName}</strong> ha sido revisada y aprobada. Ya está visible para todos los vecinos del barrio.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${storeUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Ver mi tienda</a>
        </div>
        <p style="font-size:14px;color:#444">Recuerda mantener tus productos actualizados y responder rápido a los clientes. ¡Mucho éxito!</p>
      </div>
    </div>`;
  await sendEmail(to, `¡Tu tienda "${storeName}" fue aprobada en Mercanto! ✅`, html);
}

export async function sendNewReviewEmail(
  to: string,
  ownerName: string,
  storeName: string,
  storeSlug: string,
  reviewerName: string,
  rating: number,
  comment: string | null,
) {
  const frontendUrl = process.env.FRONTEND_URL || "https://mercanto.pe";
  const storeUrl = `${frontendUrl}/stores/${storeSlug}`;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#f97316;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Nueva reseña en ${storeName}</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${ownerName}</strong>,</p>
        <p style="font-size:15px;color:#444"><strong>${reviewerName}</strong> dejó una reseña en tu tienda:</p>
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0">
          <p style="font-size:22px;margin:0 0 8px;color:#f97316">${stars}</p>
          ${comment ? `<p style="font-size:15px;color:#333;margin:0;font-style:italic">"${comment}"</p>` : '<p style="font-size:14px;color:#999;margin:0">Sin comentario adicional.</p>'}
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${storeUrl}" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Ver mi tienda</a>
        </div>
      </div>
    </div>`;
  await sendEmail(to, `Nueva reseña de ${rating} estrellas en "${storeName}"`, html);
}

export async function sendWeeklySummaryEmail(
  to: string,
  ownerName: string,
  storeName: string,
  storeSlug: string,
  stats: { visits: number; newReviews: number; avgRating: number | null; totalProducts: number },
) {
  const frontendUrl = process.env.FRONTEND_URL || "https://mercanto.pe";
  const dashboardUrl = `${frontendUrl}/vendor`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#1e40af;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Tu resumen semanal</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px">${storeName}</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${ownerName}</strong>, esto pasó en tu tienda esta semana:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0">
          <div style="background:#eff6ff;border-radius:8px;padding:16px;text-align:center">
            <p style="font-size:28px;font-weight:700;color:#1e40af;margin:0">${stats.visits}</p>
            <p style="font-size:13px;color:#555;margin:4px 0 0">visitas</p>
          </div>
          <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center">
            <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0">${stats.newReviews}</p>
            <p style="font-size:13px;color:#555;margin:4px 0 0">reseñas nuevas</p>
          </div>
          <div style="background:#fff7ed;border-radius:8px;padding:16px;text-align:center">
            <p style="font-size:28px;font-weight:700;color:#ea580c;margin:0">${stats.avgRating ? stats.avgRating.toFixed(1) : "—"}</p>
            <p style="font-size:13px;color:#555;margin:4px 0 0">rating promedio</p>
          </div>
          <div style="background:#faf5ff;border-radius:8px;padding:16px;text-align:center">
            <p style="font-size:28px;font-weight:700;color:#7c3aed;margin:0">${stats.totalProducts}</p>
            <p style="font-size:13px;color:#555;margin:4px 0 0">productos activos</p>
          </div>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${dashboardUrl}" style="background:#1e40af;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Ver mi dashboard</a>
        </div>
      </div>
    </div>`;
  await sendEmail(to, `Tu resumen semanal en Mercanto — ${storeName}`, html);
}

export async function sendIdentityApprovedEmail(to: string, name: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://mercanto.pe";
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#16a34a;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">¡Identidad Verificada!</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#444">Hemos verificado tu DNI exitosamente. Ya puedes crear tu tienda en Mercanto y comenzar a vender.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${frontendUrl}/create-store" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Crear mi tienda</a>
        </div>
        <p style="font-size:13px;color:#999;margin-top:32px">Si tienes preguntas, escríbenos a soporte@mercanto.pe</p>
      </div>
    </div>`;
  await sendEmail(to, "✅ Tu identidad ha sido verificada en Mercanto", html);
}

export async function sendIdentityRejectedEmail(to: string, name: string, reason: string) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#ef4444;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">Verificación No Aprobada</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="font-size:16px">Hola <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#444">Lamentablemente no pudimos aprobar tu verificación de identidad. El motivo es:</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;color:#991b1b;font-weight:500">${reason}</p>
        </div>
        <p style="font-size:15px;color:#444">Por favor sube nuevas fotos claras de tu DNI y vuelve a intentarlo.</p>
        <p style="font-size:13px;color:#999;margin-top:32px">Si crees que es un error, escríbenos a soporte@mercanto.pe</p>
      </div>
    </div>`;
  await sendEmail(to, "❌ Verificación de identidad rechazada en Mercanto", html);
}
