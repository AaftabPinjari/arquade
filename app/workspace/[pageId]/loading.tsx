export default function Loading() {
  // Return null to prevent showing a loading skeleton on every
  // client-side navigation. The page header and title render instantly
  // from the Zustand store. If the block content is still loading,
  // PageViewClient handles showing a localized skeleton instead.
  return null;
}
