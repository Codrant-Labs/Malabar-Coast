"use client";

import {useEffect} from "react";

export function AdminPwaRegistration() {
  useEffect(() => {
    const previousManifests = new Map<HTMLLinkElement, {href: string; rel: string}>();
    let createdManifestLink: HTMLLinkElement | null = null;
    let reconciling = false;

    const reconcileManifestLinks = () => {
      if (reconciling) return;
      reconciling = true;
      const manifestLinks = Array.from(document.querySelectorAll<HTMLLinkElement>(
        'link[rel="manifest"], link[data-admin-pwa-disabled="true"]',
      ));
      let manifestLink = manifestLinks.find((link) => link.href.endsWith("/admin/manifest.webmanifest"));
      if (!manifestLink) manifestLink = manifestLinks[0];
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        document.head.appendChild(manifestLink);
        createdManifestLink = manifestLink;
      }
      for (const link of manifestLinks) {
        if (!previousManifests.has(link)) previousManifests.set(link, {href: link.href, rel: link.rel});
        if (link === manifestLink) continue;
        if (link.dataset.adminPwaDisabled !== "true") link.dataset.adminPwaDisabled = "true";
        if (link.rel !== "alternate") link.rel = "alternate";
      }
      if (manifestLink.rel !== "manifest") manifestLink.rel = "manifest";
      if (!manifestLink.href.endsWith("/admin/manifest.webmanifest")) {
        manifestLink.href = "/admin/manifest.webmanifest";
      }
      reconciling = false;
    };

    reconcileManifestLinks();
    const manifestObserver = new MutationObserver(reconcileManifestLinks);
    manifestObserver.observe(document.head, {
      attributes: true,
      attributeFilter: ["href", "rel"],
      childList: true,
      subtree: true,
    });

    const restoreManifestLinks = () => {
      manifestObserver.disconnect();
      createdManifestLink?.remove();
      for (const [link, previous] of previousManifests) {
        link.href = previous.href;
        link.rel = previous.rel;
        delete link.dataset.adminPwaDisabled;
      }
    };

    if (!("serviceWorker" in navigator)) {
      return restoreManifestLinks;
    }
    const register = () => {
      void navigator.serviceWorker.register("/admin-sw.js", {scope: "/admin/"}).catch((error) => {
        console.error("The admin offline shell could not be registered.", error);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, {once: true});
    return () => {
      window.removeEventListener("load", register);
      restoreManifestLinks();
    };
  }, []);
  return null;
}
