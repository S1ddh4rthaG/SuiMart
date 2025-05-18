import Breadcrumb from '../components/Breadcrumb';
import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchMarketplaceDynamicObject } from '../SUIFunctions';

const Inventory = (props) => {
  const marketplaceId = props['marketplaceId'];
  const client = useSuiClient();

  const [products, setProducts] = useState([]);

  const setMarketplaceFields = async (marketplaceID: string) => {
    const res = await fetchMarketplaceDynamicObject(client, marketplaceID);
    const fProducts = res?.data?.content?.fields?.products;

    setProducts(fProducts);
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
      <Breadcrumb pageName="Product Inventory" />

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Product Name</p>
              </div>
              <div className="col-span-3 flex items-center">
                <p className="font-medium">Description</p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="font-medium">Price</p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="font-medium">Sold</p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="font-medium">Quantity</p>
              </div>
            </div>

            {products.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
              >
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {product.fields?.name}
                  </p>
                </div>
                <div className="col-span-3 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {product.fields?.description}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {BigNumber.from(product.fields?.price).toString()}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="text-sm text-meta-3">
                    {BigNumber.from(product.fields?.sold).toString()}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="text-sm text-meta-3">
                    {BigNumber.from(product.fields?.quantity).toString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Inventory;
