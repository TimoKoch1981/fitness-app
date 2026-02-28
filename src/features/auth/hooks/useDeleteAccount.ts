import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

/**
 * Hook fuer die vollstaendige Account-Loeschung (DSGVO Art. 17).
 *
 * Ruft die DB-Funktion delete_user_account() auf, die:
 * 1. Storage-Objekte loescht (Avatare)
 * 2. auth.users loescht (CASCADE loescht alle Tabellen-Daten)
 *
 * Nach erfolgreicher Loeschung: signOut() + localStorage leeren.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      // 1. DB-Funktion aufrufen (loescht alles)
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      // 2. Lokalen State aufraumen
      // localStorage-Keys die mit fitbuddy- beginnen loeschen
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fitbuddy-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 3. Supabase Session beenden
      await supabase.auth.signOut();
    },
  });
}
