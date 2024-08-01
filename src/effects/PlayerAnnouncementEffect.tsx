import { useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { triggerShowMessage } from '../hooks/useMessageBanner';

function PlayerAnnouncementEffect() {
  const { playerList } = useFirebase();
  const previousPlayerListRef = useRef<Set<string>>(new Set());
  const previousDetailsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (playerList === null) return;
    if (previousDetailsRef.current.size === playerList.length) return;

    const currentPlayerSet = new Set<string>();
    const currentDetailsMap = new Map<string, string>();

    console.log('running announce effeft')

    // Populate current sets and maps
    playerList.forEach(player => {
      currentPlayerSet.add(player.uid);
      currentDetailsMap.set(player.uid, player.displayName || 'Unknown Player');
    });

    // Check for new players
    currentPlayerSet.forEach(playerUid => {
      if (!previousPlayerListRef.current.has(playerUid) && currentDetailsMap.has(playerUid)) {
        const playerName = currentDetailsMap.get(playerUid);
        triggerShowMessage(`${playerName} has joined the game!`);
      }
    });

    // Check for players who left
    previousPlayerListRef.current.forEach(playerUid => {
      if (!currentPlayerSet.has(playerUid) && previousDetailsRef.current.has(playerUid)) {
        const playerName = previousDetailsRef.current.get(playerUid);
        triggerShowMessage(`${playerName} has left the game.`);
      }
    });

    // Synchronize the player list and details references
    previousPlayerListRef.current = currentPlayerSet;
    previousDetailsRef.current = currentDetailsMap;
  }, [playerList]);

  return null; // This effect doesn't render anything
}

export default PlayerAnnouncementEffect;
