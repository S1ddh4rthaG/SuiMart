// @ts-nocheck: Ignore type checking for the entire file

import Breadcrumb from '../components/Breadcrumb';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../networkConfig';
import { fetchMarketplaceDynamicObject } from '../SUIFunctions';

const EditProducts = (props) => {
  const client = useSuiClient();
  const suiMartPackageId = useNetworkVariable('suiMartPackageId');
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();
  const marketplaceId = props['marketplaceId'];

  const editProduct = async (selectedID) => {

    const marketplaceDynamicObject = await client.getObject({
      id: marketplaceId,
      options: { showType: true, showContent: true },
    });

    console.log('Marketplace Dynamic Object:', marketplaceDynamicObject);

    const marketplaceValue = marketplaceDynamicObject.data?.content?.fields?.value;
    console.log('Edit Product');
    console.log('Marketplace ID:', marketplaceValue);
    const tx = new Transaction();

    console.log(selectedID, name, description, price, quantity, tuskyFileId);
    tx.moveCall({
      arguments: [
        tx.object(marketplaceValue),
        tx.pure.u64(String(selectedID)),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.u64(String(price)),
        tx.pure.u64(String(quantity)),
        tx.pure.string(tuskyFileId),
      ],
      target: `${suiMartPackageId}::marketplace::edit_product`,
    });

    console.log('Transaction: ', tx);

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          alert('Product Added Successfully!');
          const { effects } = await client.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });
        },
        onError: (error) => {
          alert('Product Editing Failed!');
          console.error('Transaction Error:', error);
        },
      },
    );
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedID, setSelectedID] = useState(0);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tuskyFileId, setTuskyFileId] = useState("");

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

  const handleProductChange = (productId) => {
    productId = parseInt(productId);
    let selected = products[productId];
    console.log("Selected Product: ", selected);
    setSelectedID(productId);

    if (selected) {
      setSelectedProduct(selected.fields.name);
      setName(selected.fields.name);
      setDescription(selected.fields.description || '');
      setPrice(selected.fields.price);
      setQuantity(selected.fields.quantity);
      setTuskyFileId(selected.fields.ipfs_link || '');
    }
    else {
      setSelectedProduct(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    editProduct(selectedID)
  };

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Edit Product" />

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  🚀 Edit Your Product
                </h3>
              </div>
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">

                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5">
                    <label htmlFor="productSelect" className="mb-3 block text-sm font-medium text-black dark:text-white">Select Product</label>
                    <select id="productSelect" value={selectedProduct ? selectedProduct.id : ""} onChange={(e) => handleProductChange(e.target.value)} className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary">
                      <option value="">Select a Product</option>
                      {
                        products.map((prod, i) => {
                          return (
                            <option key={i} value={i}
                              onClick={() => handleProductChange(i)}
                            >{prod.fields.name}</option>
                          )
                        })
                      }
                    </select>
                  </div>

                  {selectedProduct && (
                    <><div className="mb-5.5">
                      <label htmlFor="productName" className="block text-sm font-medium text-black dark:text-white">Product Name</label>
                      <input
                        id="productName"
                        type="text"
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                      <div className="mb-5.5">
                        <label htmlFor="productDescription" className="block text-sm font-medium text-black dark:text-white">Description</label>
                        <textarea
                          id="productDescription"
                          className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      <div className="mb-5.5">
                        <label htmlFor="productPrice" className="block text-sm font-medium text-black dark:text-white">Price</label>
                        <input
                          id="productPrice"
                          type="number"
                          className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>

                      <div className="mb-5.5">
                        <label htmlFor="productQuantity" className="block text-sm font-medium text-black dark:text-white">Quantity</label>
                        <input
                          id="productQuantity"
                          type="number"
                          className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="tuskyFileId"
                        >
                          Tusky File ID
                        </label>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="tuskyFileId"
                          id="tuskyFileId"
                          placeholder="Tusky File ID"
                          value={tuskyFileId}
                          onChange={(e) => setTuskyFileId(e.target.value)}
                        />

                      </div>
                      <button type="submit" className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:shadow-1">Update Product</button>
                    </>
                  )}

                </form>
              </div>
            </div>
          </div>
          <div className="col-span-5 xl:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  🗿 SuiMart : Your own no-code market in Metaverse
                </h3>
              </div>
              <div className="p-7">
                😯 Create your own market on Metaverse easily without any coding hassle.
                <br /><br />
                😍 SuiMart is powered by Sui Network for quick payments and low gas fees!
                <br /><br />
                🤑 Take your market to next level by adding 3D models of your products.
                <br /><br />
                ✳️ Increase your sales to international customers by accepting crypto payments.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProducts;
