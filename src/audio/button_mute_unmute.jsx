import { AudioDisabledIcon } from "./audio_disabled_icon.jsx";
import { AudioEnabledIcon } from "./audio_enabled_icon.jsx";
import { mute, mutedSignal, unmute } from "./sound_signals.js";
import { Box } from "/components/box/box.jsx";

export const ButtonMuteUnmute = () => {
  const muted = mutedSignal.value;
  if (muted) {
    return (
      <Box.button onClick={unmute} width="32">
        <AudioDisabledIcon />
      </Box.button>
    );
  }
  return (
    <Box.button onClick={mute} width="32">
      <AudioEnabledIcon />
    </Box.button>
  );
};
