import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const url = `http://localhost:3000/verify-email?token=${token}`; // neskôr zmeníš na produkčnú URL

  const mailOptions = {
    from: `"UniPlan" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Overenie emailovej adresy",
    html: `
      <p>Ahoj,</p>
      <p>Ďakujeme za registráciu do UniPlan. Pred prihlásením si prosím over svoju emailovú adresu kliknutím na odkaz nižšie:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Ak si sa neregistroval ty, môžeš tento email ignorovať.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
