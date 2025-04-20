/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";

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
  port: Number(process.env.SMTP_PORT),
  host: process.env.SMTP_HOST,
  tls: {
    rejectUnauthorized: false
  },
});

export async function sendMail(options: ISendMailOptions): Promise<boolean> {
  async function send() {
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
  }

  // Do some initial validation of data
  try { await sendMailOptionsSchema.parseAsync(options); }
  catch { return false }

  if (process.env.NODE_ENV === "production") {
    send();
  } else {
    console.log(`Sending mail to ${options.to}: ${options.text || options.html}`)
  }

  return true;
}

export function verifyEmailInput(email: string): boolean {
	return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string) {
  const result = await Database.query(`
    SELECT
      email
    FROM ${DB}.user
    WHERE
      email = :email
  `, { email });
	return !result.length;
}
