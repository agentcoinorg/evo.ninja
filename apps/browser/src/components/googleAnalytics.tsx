interface Window {
    gtag: any;
  }
  declare var window: Window;
  
  export const trackMessageSent = (message: string) => {
    try {
      if (window.gtag) { // Check if gtag is initialized
        window.gtag('event', 'message_sent', {
          'event_category': 'Chat',
          'event_label': 'GOALS',
          'value': message // The actual message content
        });
        console.log('GA event sent');
      } else {
        console.log('GA not initialized');
      }
    } catch (error) {
      console.log('Error sending GA event:', error);
    }
  };
  