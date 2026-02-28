/**
 * SpotifyCallback — Handles the OAuth redirect from Spotify.
 *
 * Opened in a popup window. Receives ?code=...&state=... query params.
 * Sends the code to the parent window and closes itself.
 */

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function SpotifyCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(error === 'access_denied' ? 'Zugriff verweigert' : error);
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (code && state) {
      // Send to parent (opener) window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'spotify-callback', code, state },
          window.location.origin,
        );
        setStatus('success');
        setTimeout(() => window.close(), 1500);
      } else {
        setStatus('error');
        setErrorMsg('Kein übergeordnetes Fenster gefunden');
      }
    } else {
      setStatus('error');
      setErrorMsg('Fehlende Parameter');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        {status === 'processing' && (
          <>
            <Loader2 className="h-8 w-8 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-white">Verbinde Spotify...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <p className="text-white">Spotify verbunden!</p>
            <p className="text-sm text-gray-400 mt-1">Fenster schließt sich automatisch...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-white">Fehler</p>
            <p className="text-sm text-gray-400 mt-1">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
}
