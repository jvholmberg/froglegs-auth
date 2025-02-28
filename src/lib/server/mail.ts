import nodemailer from "nodemailer";
import { z } from "zod";

const sendMailOptionsSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
});

type ISendMailOptions = z.infer<typeof sendMailOptionsSchema>;

const transporter = nodemailer.createTransport({
  port: 25,
  host: 'kobra.kaxig.com',
  tls: {
    rejectUnauthorized: false
  },
});

export async function sendMail(options: ISendMailOptions): Promise<boolean> {

  // Do some initial validation of data
  try { await sendMailOptionsSchema.parseAsync(options); }
  catch { return false }

  if (process.env.NODE_ENV === "production") {
    const info = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    if (info.rejected.length) {
      console.log(`Sending mail failed: ${info.rejected.join(", ")}`);
    }
  } else {
    console.log(`Sending mail to ${options.to}: ${options.text || options.html}`);
  }

  return true;
}
