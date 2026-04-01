import { headers } from 'next/headers';
import MomotaroApp from '@/components/MomotaroApp';

export default async function Page() {
  const headersList = await headers();
  const appMode = headersList.get('x-app-mode') || 'dine-in';
  const tableId  = headersList.get('x-table-id')  || 'table-1';

  return <MomotaroApp appMode={appMode} tableId={tableId} />;
}