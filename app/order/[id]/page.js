import { Page } from '@/components/SiteChrome';
import OrderTracker from '@/components/OrderTracker';
export default async function OrderPage({ params }) { return <Page><OrderTracker id={params.id}/></Page>; }
