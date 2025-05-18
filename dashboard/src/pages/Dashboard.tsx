import { useEffect } from 'react';
import CardFour from '../components/CardFour.tsx';
import CardOne from '../components/CardOne.tsx';
import CardThree from '../components/CardThree.tsx';
import CardTwo from '../components/CardTwo.tsx';
import { useState } from 'react';
import ChartThree from '../components/ChartThree.tsx';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchMarketplaceDynamicObject } from '../SUIFunctions.ts';

const Dashboard = (props: { [x: string]: any }) => {
  const marketplaceId = props['marketplaceId'];
  const client = useSuiClient();

  const [productCount, setProductCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [customers, setCustomers] = useState(0);

  const setMarketplaceFields = async (marketplaceID: string) => {
    const res = await fetchMarketplaceDynamicObject(client, marketplaceID);

    const fProducts = res?.data?.content?.fields?.products;

    console.log('fProducts:', fProducts);
    setProductCount(fProducts.length);
    setTotalRevenue(
      fProducts.reduce((acc, product) => {
        return acc + parseFloat(product.fields?.price * product.fields?.sold);
      }, 0),
    );
    setCustomers(fProducts.reduce((acc, product) => {
        return acc + parseFloat(product.fields?.sold);
        }
    , 0),
    );
  };

  useEffect(() => {
    if (marketplaceId) {
      setMarketplaceFields(marketplaceId);
    } else {
      console.error('marketplaceId is not defined');
    }
  }, [marketplaceId]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardOne val={productCount} /> {/* Product Inventory */}
        <CardTwo val={productCount} /> {/* Products Listed */}
        <CardThree val={customers} /> {/* Happy Customers */}
        <CardFour val={totalRevenue} /> {/* Marketplace Revenue */}
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
            <span className="pl-1 pb-1 text-lg text-gray-500 dark:text-white">
                Analytics Dashboard coming soon..
            </span>
          <ChartThree />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
