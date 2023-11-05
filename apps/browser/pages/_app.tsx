import React from 'react';
import type { AppProps } from 'next/app'

// window.Buffer = window.Buffer || require("buffer").Buffer;

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
 
export default function EvoApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}