import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewPage from './pages/OverviewPage';
import AnalyzePage from './pages/AnalyzePage';
import ClustersPage from './pages/ClustersPage';
import ExplorerPage from './pages/ExplorerPage';
import ReportsPage from './pages/ReportsPage';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Auto-load sample dataset on initial launch for immediate demonstration!
  useEffect(() => {
    handleQuickSample();
  }, []);

  const handleQuickSample = async () => {
    setIsSampleLoading(true);
    setApiError(null);
    try {
      const data = await api.loadSample();
      setDatasetInfo({
        dataset_id: data.dataset_id,
        filename: data.filename,
        columns: data.columns,
        detected_message_col: data.detected_message_col,
        detected_source_col: data.detected_source_col,
        detected_level_col: data.detected_level_col,
        detected_device_col: data.detected_device_col,
        detected_timestamp_col: data.detected_timestamp_col,
        total_rows: data.total_rows,
        preview: data.preview,
      });
      setAnalysisResults(data.results);
      setApiError(null);
    } catch (err) {
      console.error('Failed to load sample dataset automatically:', err);
      const detail = err.response?.data?.detail || err.message || 'Connection failed';
      setApiError(`Could not load dataset from backend: ${detail}`);
    } finally {
      setIsSampleLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAnalysis={!!analysisResults}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <Topbar
          activeTab={activeTab}
          onQuickSample={handleQuickSample}
          isSampleLoading={isSampleLoading}
          datasetInfo={datasetInfo}
          analysisResults={analysisResults}
        />

        <main className="flex-1 min-h-0 p-6 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                results={analysisResults}
                datasetInfo={datasetInfo}
                onNavigateAnalyze={() => setActiveTab('analyze')}
                onQuickSample={handleQuickSample}
                isSampleLoading={isSampleLoading}
                apiError={apiError}
              />
            )}

            {activeTab === 'analyze' && (
              <AnalyzePage
                datasetInfo={datasetInfo}
                setDatasetInfo={setDatasetInfo}
                setAnalysisResults={setAnalysisResults}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'clusters' && (
              <ClustersPage
                results={analysisResults}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'explorer' && (
              <ExplorerPage results={analysisResults} />
            )}

            {activeTab === 'reports' && (
              <ReportsPage
                results={analysisResults}
                datasetInfo={datasetInfo}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
