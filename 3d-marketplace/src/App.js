import { Billboard, Html, KeyboardControls, Loader, PointerLockControls, PresentationControls, Sky, Stars, Text } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Physics, RigidBody } from "@react-three/rapier"
import { Suspense, useEffect, useRef, useState } from "react"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as THREE from "three"
import { useSharedState } from "./sharedState.js"
import { Player } from "./Player.js"
import { Model } from "./Show2.jsx"

// SUI Imports
import { Transaction } from "@mysten/sui/transactions"
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { useNetworkVariable } from "./networkConfig.js"
import { fetchMarketplaceDynamicObject } from "./SUIFunctions.js"

const DESIRED_SIZE = 4.5;

// Fetches a GLTF file as a blob from Tusky API and loads it
const ProductModel = ({ file }) => {
  const tuskyFileId = file;
  const [gltf, setGltf] = useState(null);
  const ref = useRef();

  useEffect(() => {
    if (!tuskyFileId) return;
    let isMounted = true;

    async function fetchAndLoad() {
      try {
        console.log("[Tusky] Fetching binary stream for file ID:", tuskyFileId);
        const resp = await fetch(
          `https://api.tusky.io/files/${tuskyFileId}/data`,
          {
            headers: {
              "Api-Key": process.env.REACT_APP_TUSKY_API_KEY,
            },
          }
        );

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();

        const url = URL.createObjectURL(blob);
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltfObj) => {
            if (!isMounted) return;
            setGltf(gltfObj);
            URL.revokeObjectURL(url);
            console.log("[GLTFLoader] Model loaded successfully", gltfObj);
          },
          undefined,
          (err) => console.error("[GLTFLoader] Error loading model:", err)
        );
      } catch (err) {
        console.error("[ProductModel] Failed to fetch or load:", err);
      }
    }

    fetchAndLoad();
    return () => { isMounted = false; };
  }, [tuskyFileId]);

  useEffect(() => {
    if (gltf?.scene && ref.current) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = DESIRED_SIZE / maxDim;
      ref.current.scale.set(scale, scale,scale);
      ref.current.position.set(0, 0, 0);
    }
  }, [gltf]);

  if (!gltf) return <Html center>Loading model…</Html>;
  return <primitive object={gltf.scene} ref={ref} />;
};

function EquidistantPoints({ products, buyProduct }) {
  const { setPrice, setText, setDesc } = useSharedState();
  const points = [];
  const numPoints = products.length;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const z = Math.cos(angle) * 5;
    const x = Math.sin(angle) * 5;
    const y = 0.4;
    const mul = 3;
    points.push([x * mul, y * mul, z * mul]);
  }

  function clear() {
    setPrice("");
    setText("");
    setDesc("");
  }

  return (
    <>
      {points.map((point, index) => (
        <PresentationControls
          key={index}
          enabled={!document.pointerLockElement}
          snap={true}
          azimuth={[-Infinity, Infinity]}
          polar={[0, 0]}
        >
          <RigidBody type="fixed">
            <EquidistantMesh
              position={point}
              index={index}
              product={products[index]}
              buyProduct={buyProduct}
              clear={clear}
            />
          </RigidBody>
        </PresentationControls>
      ))}
    </>
  );
}

function EquidistantMesh({ position, index, product, buyProduct, clear }) {
  const ref = useRef();
  const { setPrice, setText, setDesc } = useSharedState();

  useFrame(() => {
    ref.current.rotation.y += 0.005;
  });

  return (
    <mesh
      position={position}
      ref={ref}
      onPointerEnter={() => {
        setPrice(product.price);
        setText(product.name);
        setDesc(product.description);
      }}
      onPointerLeave={() => clear()}
      onClick={async () => {
        console.log("Clicked on product(index:", index);
        setDesc("Buying...");
        buyProduct(index);
      }}
    >
      <pointLight position={[0, 2, 0]} intensity={1.2} distance={5} color="white" />
      <Suspense fallback={<Html center>Loading model…</Html>}>
        <ProductModel file={product.ipfs_link} />
      </Suspense>
    </mesh>
  );
}

export default function App() {
  const client = useSuiClient();
  const suiMartPackageId = useNetworkVariable("suiMartPackageId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const queryParams = new URLSearchParams(window.location.search);
  const address = queryParams.get("market") || "loading...";

  const hours = 12 + new Date().getHours();
  const namecolor = hours > 18 && hours < 32 ? "green" : "white";
  const inclination = 0;
  const azimuth = (hours / 24) * 2 * Math.PI;
  const sunPosition = [
    Math.sin(azimuth) * Math.cos(inclination),
    Math.cos(azimuth) * Math.cos(inclination),
    Math.sin(inclination),
  ];

  const [marketname, setMarketName] = useState("loading...");
  const [products, setProducts] = useState([]);
  const [marketdesc, setMarketDesc] = useState("loading...");

  const marketplaceId = address;

  const buyProduct = async (selectedID) => {
    const marketplaceDynamicObject = await client.getObject({
      id: marketplaceId,
      options: { showType: true, showContent: true },
    });

    const marketplaceValue = marketplaceDynamicObject.data?.content?.fields?.value;
    const tx = new Transaction();
    
    // Convert price to string to avoid BigInt issues
    const price = products[selectedID].price;
    console.log("[buyProduct] price value:", price, "type:", typeof price);
    const priceStr = typeof price === "bigint" ? price.toString() : String(price);
    
    const payment = tx.splitCoins(tx.gas, [
      (() => {
        console.log("[buyProduct] priceStr:", priceStr, "type:", typeof priceStr);
        return tx.pure.u64(priceStr);
      })()
    ]);
    
    console.log("[buyProduct] selectedID value:", selectedID, "type:", typeof selectedID);
    console.log("[buyProduct] payment:", payment);
    tx.setGasBudget(10000000);

    tx.moveCall({
      arguments: [
        tx.object(marketplaceValue),
        (() => {
          const val = String(selectedID);
          console.log("[buyProduct] tx.pure.u64(selectedID):", val, "type:", typeof val);
          return tx.pure.u64(val);
        })(),
        (() => {
          const one = "1";
          console.log("[buyProduct] tx.pure.u64(1):", one, "type:", typeof one);
          return tx.pure.u64(one);
        })(),
        payment
      ],
      target: `${suiMartPackageId}::marketplace::buy_product`,
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          alert("Product Purchased Successfully!");
          await client.waitForTransaction({ digest, options: { showEffects: true } });
        },
        onError: (error) => {
          alert("Product Purchase Failed!");
          console.error("Transaction Error:", error);
        },
      }
    );
  };

  const setMarketplaceFields = async (marketplaceID) => {
    console.log("[setMarketplaceFields] called with marketplaceID:", marketplaceID, "type:", typeof marketplaceID);
    const res = await fetchMarketplaceDynamicObject(client, marketplaceID);
    console.log("[setMarketplaceFields] fetchMarketplaceDynamicObject result:", res);
    const fProducts = res?.data?.content?.fields?.products;
    console.log("[setMarketplaceFields] fProducts:", fProducts, Array.isArray(fProducts), fProducts && fProducts.length);

    setMarketName(res?.data?.content?.fields?.name);
    setMarketDesc(res?.data?.content?.fields?.description);

    const mapped = fProducts.map((p, idx) => {
      console.log(`[setMarketplaceFields] Product #${idx}:`, p);
      const price = p.fields.price;
      const quantity = p.fields.quantity;
      console.log(`[setMarketplaceFields] Product #${idx} price:`, price, "type:", typeof price);
      console.log(`[setMarketplaceFields] Product #${idx} quantity:`, quantity, "type:", typeof quantity);
      return {
        name: p.fields.name,
        description: p.fields.description,
        price: price,
        quantity: quantity,
        ipfs_link: p.fields.ipfs_link,
      };
    });
    console.log("[setMarketplaceFields] mapped products:", mapped);
    setProducts(mapped);
  };

  useEffect(() => {
    if (marketplaceId) setMarketplaceFields(marketplaceId);
    else console.error("marketplaceId is not defined");
  }, [marketplaceId]);

  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "w", "W"] },
        { name: "backward", keys: ["ArrowDown", "s", "S"] },
        { name: "left", keys: ["ArrowLeft", "a", "A"] },
        { name: "right", keys: ["ArrowRight", "d", "D"] },
        { name: "jump", keys: ["Space"] },
      ]}
    >
      <Suspense>
        <Canvas camera={{ fov: 45 }} shadows>
          <Sky distance={450} sunPosition={sunPosition} inclination={0} azimuth={0.25} />
          <Stars depth={100} />

          <Billboard follow={true} lockX={false} lockY={false}>
            <Text font="./Inter-Bold.woff" position={[0, 5, 0]} fontSize={0.75} color={namecolor}>🏪 {marketname}</Text>
            <Text font="./Inter-Bold.woff" position={[0, 4, 0]} fontSize={0.25}> {address} </Text>
            <Text font="./Inter-Regular.woff" position={[0, 3, 0]} fontSize={0.2}> {marketdesc} </Text>
          </Billboard>

          <Physics>
            <Model />
            <Player />
            <Suspense fallback={<Html center>Loading models…</Html>}>
              <EquidistantPoints products={products} buyProduct={buyProduct} />
            </Suspense>

            {/* <Debug/> */}
          </Physics>

          <PointerLockControls />
          <ambientLight intensity={0.1} />
          <pointLight position={[0, 10, 0]} intensity={0.4} />
        </Canvas>
      </Suspense>
      <Loader />
    </KeyboardControls>
  );
}
