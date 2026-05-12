import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { mediaSource, pickAndUploadPhoto } from '../lib/media';
import { ErrorText, GhostButton, Muted } from './ui';
import { theme } from '../theme';

/**
 * Profile-photo control shared by onboard + edit-dog: a 64px thumbnail (the
 * current stored media, a freshly-picked local uri, or a 🐾 placeholder) plus
 * Library / Camera / Remove buttons. Reports the new media id via `onChange`
 * (or `null` on remove). Uploads happen inside `pickAndUploadPhoto`.
 */
export function PhotoPickerRow({
  mediaId,
  onChange,
  label = 'Profile photo (optional)',
}: {
  mediaId: string | null | undefined;
  onChange: (mediaId: string | null) => void;
  label?: string;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(camera: boolean) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const picked = await pickAndUploadPhoto({ camera });
      if (picked) {
        setLocalUri(picked.localUri);
        onChange(picked.media.id);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add that photo.');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    setLocalUri(null);
    onChange(null);
  }

  const has = !!mediaId;
  const thumb = localUri ? { uri: localUri } : mediaId ? mediaSource(mediaId, 'thumb') : null;

  return (
    <View>
      <View style={s.row}>
        <View style={s.thumb}>
          {thumb ? (
            <Image source={thumb} style={s.img} resizeMode="cover" />
          ) : (
            <Text style={s.ph}>🐾</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Muted>{label}</Muted>
          <View style={s.btns}>
            <View style={s.btn}>
              <GhostButton
                label={busy ? 'Uploading…' : has ? 'Change' : 'Library'}
                onPress={() => pick(false)}
              />
            </View>
            <View style={s.btn}>
              <GhostButton label="Camera" onPress={() => pick(true)} />
            </View>
            {has ? (
              <View style={s.btn}>
                <GhostButton label="Remove" onPress={remove} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
      {err ? <ErrorText>{err}</ErrorText> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  thumb: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  ph: { fontSize: 24 },
  btns: { flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' },
  btn: { flexGrow: 1, flexBasis: 84 },
});
