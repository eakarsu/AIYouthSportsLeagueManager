import React from 'react';
import AIReport from './AIReport';

export default function AIResultDisplay({ result }) {
  return <AIReport response={result} title="AI analysis" />;
}
