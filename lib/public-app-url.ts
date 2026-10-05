type PublicUrlSetting = "APP_BASE_URL" | "READYSCORE_PUBLIC_URL";

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".localhost.localdomain") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  );
}

export function getPublicAppBaseUrl(
  request?: Pick<Request, "url">,
  preferredSetting: PublicUrlSetting = "APP_BASE_URL",
): string {
  const configured =
    process.env[preferredSetting]?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.READYSCORE_PUBLIC_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${preferredSetting}_NOT_CONFIGURED`);
    }
    return request ? new URL(request.url).origin : "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error(`${preferredSetting}_INVALID`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${preferredSetting}_INVALID`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    (url.protocol !== "https:" || isLoopbackHost(url.hostname))
  ) {
    throw new Error(`${preferredSetting}_INVALID_FOR_PRODUCTION`);
  }

  return url.origin;
}

export function getPublicAppUrl(
  path: string,
  request?: Pick<Request, "url">,
  preferredSetting: PublicUrlSetting = "APP_BASE_URL",
): URL {
  return new URL(path, `${getPublicAppBaseUrl(request, preferredSetting)}/`);
}
