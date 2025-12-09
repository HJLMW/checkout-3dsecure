import { SafeAreaView } from 'react-native-safe-area-context';
import './global.css';
import { PaymentScreen } from './components/PaymentScreen';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <PaymentScreen />
    </SafeAreaView>
  );
}
