interface Window {
  gtag: any;
}
declare var window: Window;

export const trackMessageSent = (message: string) => {
  try {
    if (window.gtag) {
      // Check if gtag is initialized
      window.gtag("event", "message_sent", {
        event_category: "Chat",
        event_label: message, // Log the message as a label
        value: 1, // 1 message was sent
      });
      console.log("GA event sent");
    } else {
      console.log("GA not initialized");
    }
  } catch (error) {
    console.log("Error sending GA event:", error);
  }
};

export const trackThumbsFeedback = (feedback: string) => {
  try {
    if (window.gtag) {
      window.gtag("event", "goal_results", {
        event_category: "feedback",
        event_label: feedback,
        value: 1,
      });
      console.log("GA event sent");
    } else {
      console.log("GA not initialized");
    }
  } catch (error) {
    console.log("Error sending GA event:", error);
  }
};
