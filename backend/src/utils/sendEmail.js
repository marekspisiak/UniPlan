import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, token, isReminder = false) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const url = `http://localhost:3000/verify-email?token=${token}`;

  const title = isReminder
    ? "Znovu over svoj školský email"
    : "Overenie emailovej adresy";

  const intro = isReminder
    ? "Tvoja emailová adresa už nie je overená. Obnov si prístup kliknutím na odkaz nižšie:"
    : "Ďakujeme za registráciu do UniPlan. Pred prihlásením si prosím over svoju emailovú adresu kliknutím na odkaz nižšie:";

  const mailOptions = {
    from: `"UniPlan" <${process.env.EMAIL_FROM}>`,
    to,
    subject: title,
    html: `
      <p>Ahoj,</p>
      <p>${intro}</p>
      <p><a href="${url}">${url}</a></p>
      <p>Ak si si o to nežiadal, môžeš tento email ignorovať.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
