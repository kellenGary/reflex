import { Link } from 'expo-router';
import { Text } from 'react-native';

export function Wordmark() {
  return (
    <Link href="/" accessibilityLabel="reflex home">
      <Text className="text-[19px] font-bold tracking-tight text-ink">reflex</Text>
    </Link>
  );
}
