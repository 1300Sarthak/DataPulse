import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

const TOP_OPTIONS = [25, 50, 100];

const StocksPage = () => {
  const [topN, setTopN] = useState(50);
  const [showModal, setShowModal] = useState(true);

  // Placeholder data
  const stocks = Array.from({ length: topN }, (_, i) => ({
    symbol: `STOCK${i + 1}`,
    name: `Stock ${i + 1}`,
    price: (Math.random() * 1000).toFixed(2),
  }));

  return (
    <>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md" classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        header: "bg-white dark:bg-gray-800",
        body: "bg-white dark:bg-gray-800",
        footer: "bg-white dark:bg-gray-800"
      }}>
        <ModalContent>
          <ModalHeader>This page is currently under construction</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-200">We're working hard to bring you this feature soon. Please check back later!</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top {topN} Stocks</h1>
          <select
            className="border rounded px-3 py-1 dark:bg-gray-800 dark:text-white"
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
          >
            {TOP_OPTIONS.map(opt => (
              <option key={opt} value={opt}>Top {opt}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stocks.map(stock => (
            <div key={stock.symbol} className="card-light dark:card-dark p-4 rounded shadow transition-colors">
              <div className="font-bold text-lg">{stock.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-100">{stock.symbol}</div>
              <div className="mt-2 text-xl font-semibold">${stock.price}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default StocksPage; 