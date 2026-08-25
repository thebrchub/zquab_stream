// src/utils/analytics.ts

export const trackChatClick = (buttonLocation: string) => {
  // We check if window and gtag exist to prevent crashes if ad-blockers block analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'start_chat_click', {
      event_category: 'Engagement',
      event_label: buttonLocation, // This will tell you if they clicked the Hero button or the Footer button
    });
  }
};