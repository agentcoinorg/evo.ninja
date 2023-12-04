interface Window {
  gtag: any;
}
declare var window: Window;

export const trackThumbsFeedback = (feedback: string) => {
  try {
    if (window.gtag) {
      window.gtag("event", "goal_results", {
        event_category: "feedback",
        event_label: feedback,
        value: 1,
      });
    } else {
      console.log("GA not initialized");
    }
  } catch (error) {
    console.log("Error sending GA event:", error);
  }
};
