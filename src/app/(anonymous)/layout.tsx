import { Center, Paper } from "@mantine/core";
import classes from "./layout.module.css";
import { Image } from "@mantine/core";
import { getTheme } from "@/lib/server/theme";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();
  const headerLogo = theme?.header_logo_url ?? "/logo_25.png";
  const backdrop = theme?.backdrop_url ?? "/banksy.png";
  const alt = theme?.alt_text ?? "Logotype"
  const position = theme?.backdrop_position ?? "center";
  const headerLogoHeight = theme?.header_logo_height ?? 140;
  const headerLogoWidth = theme?.header_logo_width ?? 300;
  
	return (
    <div 
      className={classes.wrapper} 
      style={{
        backgroundPosition: `${position}`,
        backgroundImage: `url(${backdrop})`
      }} >
      <Paper className={classes.form} radius={0} p={30}>
        <Center>
          <Image
            src={headerLogo}
            alt={alt}
            height={headerLogoHeight}
            width={headerLogoWidth} />
        </Center>
        {children}
      </Paper>
    </div>
	);
}
