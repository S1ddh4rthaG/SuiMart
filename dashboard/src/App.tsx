import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from './networkConfig';

import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { MARKETPLACE_FACTORY } from './constants';
import { fetchMarketplaceDynamicObject } from './SUIFunctions';

import Loader from './common/Loader';
import routes from './routes';
import Dashboard from './pages/Dashboard';
const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const client = useSuiClient();
  const suiMartPackageId = useNetworkVariable('suiMartPackageId');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [account, setAccount] = useState<string>('');

  const [retailerContractId, setRetailerContractId] = useState<string>('');
  const [marketplaceId, setMarketplaceId] = useState<string>('');

  // Retailer Form Data
  const [isRegisteredRetailer, setIsRegisteredRetailer] =
    useState<boolean>(false);
  const [marketPlaceName, setMarketPlaceName] = useState<string>('');
  const [marketPlaceDescription, setMarketPlaceDescription] =
    useState<string>('');

  // SuiDataActions
  const fetchMarketplaceFactory = async () => {
    const res = await client.getObject({
      id: MARKETPLACE_FACTORY,
      options: { showType: true, showContent: true },
    });

    console.log('Marketplace Factory:', res.data);
    return res.data;
  };

  const fetchRetailersMap = async () => {
    let retailerContractID = retailerContractId;
    if (!retailerContractId) {
      const marketplaceFactory = await fetchMarketplaceFactory();
      const retailerContractId =
        marketplaceFactory?.content?.fields?.retailerContract?.fields?.id?.id;

      retailerContractID = retailerContractId;
      setRetailerContractId(retailerContractId);
    }

    const res = await client.getDynamicFields({ parentId: retailerContractID });

    let retailers = res.data.map((item: any) => {
      return { address: item.name.value, dynamicObjectId: item.objectId };
    });

    let retailersMap = new Map();
    retailers.forEach((retailer: any) => {
      retailersMap.set(retailer.address, retailer.dynamicObjectId);
    });

    const accountAddress = currentAccount?.address;
    const isRetailer = retailersMap.has(accountAddress);
    setIsRegisteredRetailer(isRetailer);
    setMarketplaceId(retailersMap.get(accountAddress));
    setMarketplaceFields(retailersMap.get(accountAddress));

    console.log('Retailers Map:', retailersMap);
    console.log('Account Address:', accountAddress);
    console.log('Is Retailer:', isRetailer);
    console.log('Retailer Object ID:', retailersMap.get(accountAddress));
  };

  const createMarketPlace = () => {
    console.log('Create New Marketplace');
    const tx = new Transaction();

    tx.moveCall({
      arguments: [
        tx.object(MARKETPLACE_FACTORY),
        tx.pure.string(marketPlaceName),
        tx.pure.string(marketPlaceDescription),
      ],
      target: `${suiMartPackageId}::marketplace::create_marketplace`,
    });

    console.log('Transaction: ', tx);

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await client.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });
          fetchRetailersMap();
        },
      },
    );
  };

  const currentAccount = useCurrentAccount();

  const setMarketplaceFields = async (marketplaceID: string) => {
    const res = await fetchMarketplaceDynamicObject(client, marketplaceID);

    setMarketPlaceName(res?.data?.content?.fields?.name);
    setMarketPlaceDescription(res?.data?.content?.fields?.description);
  };

  function resetAllStates() {
    setAccount('');
    setIsRegisteredRetailer(false);
    setMarketPlaceName('');
    setMarketPlaceDescription('');

    setRetailerContractId('');
    setMarketplaceId('');
  }
  useEffect(() => {
    if (currentAccount) {
      setAccount(currentAccount.address);
      fetchRetailersMap();
    } else {
      resetAllStates();
    }
  }, [currentAccount]);

  return (
    <>
      {/* Create a nice navbar */}
      {isRegisteredRetailer ? (
        <Routes>
          <Route
            element={
              <DefaultLayout
                val={account}
                market={marketplaceId}
                marketName={marketPlaceName}
              />
            }
          >
            {account && (
              <Route
                index
                element={
                  <Dashboard
                    {...{
                      marketplaceId: marketplaceId,
                    }}
                  />
                }
              />
            )}
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={
                  <Suspense fallback={<Loader />}>
                    <route.component
                      {...{
                        marketplaceId: marketplaceId,
                      }}
                    />
                  </Suspense>
                }
              />
            ))}
          </Route>
        </Routes>
      ) : (
        <section className="container mx-auto p-6">
          {/* Header with title and a right-aligned button */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-primary-light">
              SuiMart
            </h1>
            <ConnectButton className="bg-primary-light text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition">
              Connect Wallet
            </ConnectButton>
          </div>
        
          {/* Two-column layout: form on left, info card on right */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Register Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-primary-light mb-4">
                🏪 Register a Marketplace
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  createMarketPlace();
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="marketPlaceName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Marketplace Name
                  </label>
                  <input
                    id="marketPlaceName"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter name"
                    value={marketPlaceName}
                    onChange={(e) => setMarketPlaceName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="marketPlaceDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="marketPlaceDescription"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us about your marketplace"
                    value={marketPlaceDescription}
                    onChange={(e) => setMarketPlaceDescription(e.target.value)}
                  />
                </div>
                <button
                    type="submit"
                  className="w-full flex justify-center items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition"
                >
                  Register
                </button>
              </form>
            </div>
        
            {/* Info Card */}
            <div className="bg-gradient-to-br from-secondary-light to-secondary dark:from-secondary dark:to-secondary-dark text-neutral-900 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-3">
                🗿 SuiMart
              </h2>
              <p className="mb-4">
                😯 Create your own market in the Metaverse without any coding hassle.
              </p>
              <p className="mb-4">
                😍 Powered by Sui Network for quick payments and low gas fees!
              </p>
              <p>
                🤑 Take it to the next level by adding 3D models of your products.
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default App;
