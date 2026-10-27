import { Platform, Share } from 'react-native';

/** Saves `contents` as a file on the web, or opens the share sheet on a phone. */
export async function saveFile(filename: string, contents: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ message: contents, title: filename });
}
