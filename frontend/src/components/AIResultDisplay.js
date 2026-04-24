import React from 'react';
import {
  FaLightbulb,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaChartBar,
  FaListUl,
  FaStar,
} from 'react-icons/fa';

function AIResultDisplay({ result }) {
  if (!result) return null;

  // If result is a string, parse it into sections
  const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  const sections = parseContent(content);

  return (
    <div className="ai-result-container">
      {sections.map((section, index) => (
        <div key={index} className="ai-result-section" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="section-header">
            <span className="section-icon">{getSectionIcon(section.type)}</span>
            {section.title}
          </div>
          <div className="section-body">
            {section.items.map((item, i) => renderItem(item, i))}
          </div>
        </div>
      ))}
    </div>
  );
}

function parseContent(text) {
  const sections = [];
  const lines = text.split('\n').filter((l) => l.trim());

  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers (lines ending with : or starting with # or **)
    if (
      trimmed.match(/^#{1,3}\s+/) ||
      trimmed.match(/^\*\*[^*]+\*\*:?$/) ||
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.startsWith('-') && !trimmed.startsWith('*'))
    ) {
      const title = trimmed
        .replace(/^#{1,3}\s+/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*:?$/, '')
        .replace(/:$/, '')
        .trim();

      currentSection = {
        title,
        type: detectSectionType(title),
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        title: 'Analysis',
        type: 'info',
        items: [],
      };
      sections.push(currentSection);
    }

    // Detect bullet points
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
      const bulletText = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
      const itemType = detectItemType(bulletText);
      currentSection.items.push({ type: 'bullet', text: bulletText, sentiment: itemType });
    } else {
      currentSection.items.push({ type: 'paragraph', text: trimmed });
    }
  }

  // If no sections were created, wrap everything in a single section
  if (sections.length === 0) {
    sections.push({
      title: 'AI Analysis',
      type: 'info',
      items: [{ type: 'paragraph', text }],
    });
  }

  return sections;
}

function detectSectionType(title) {
  const lower = title.toLowerCase();
  if (lower.includes('recommend') || lower.includes('suggestion')) return 'recommendation';
  if (lower.includes('warning') || lower.includes('caution') || lower.includes('risk')) return 'warning';
  if (lower.includes('summary') || lower.includes('overview') || lower.includes('analysis')) return 'info';
  if (lower.includes('score') || lower.includes('rating') || lower.includes('metric')) return 'metric';
  if (lower.includes('strength') || lower.includes('positive') || lower.includes('success')) return 'positive';
  if (lower.includes('weakness') || lower.includes('improve') || lower.includes('concern')) return 'warning';
  if (lower.includes('action') || lower.includes('next step') || lower.includes('plan')) return 'action';
  return 'info';
}

function detectItemType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('excellent') || lower.includes('strong') || lower.includes('great') || lower.includes('good'))
    return 'positive';
  if (lower.includes('warning') || lower.includes('caution') || lower.includes('consider') || lower.includes('may'))
    return 'warning';
  if (lower.includes('critical') || lower.includes('poor') || lower.includes('weak') || lower.includes('concern'))
    return 'negative';
  return 'info';
}

function getSectionIcon(type) {
  switch (type) {
    case 'recommendation':
      return <FaLightbulb />;
    case 'positive':
      return <FaCheckCircle />;
    case 'warning':
      return <FaExclamationTriangle />;
    case 'negative':
      return <FaTimesCircle />;
    case 'metric':
      return <FaChartBar />;
    case 'action':
      return <FaStar />;
    case 'info':
    default:
      return <FaInfoCircle />;
  }
}

function getRecommendationIcon(sentiment) {
  switch (sentiment) {
    case 'positive':
      return <FaCheckCircle style={{ color: 'var(--accent)' }} />;
    case 'warning':
      return <FaExclamationTriangle style={{ color: 'var(--warning)' }} />;
    case 'negative':
      return <FaTimesCircle style={{ color: 'var(--danger)' }} />;
    case 'info':
    default:
      return <FaInfoCircle style={{ color: 'var(--secondary)' }} />;
  }
}

function renderItem(item, index) {
  if (item.type === 'bullet') {
    return (
      <div key={index} className={`ai-recommendation ${item.sentiment}`}>
        <span className="rec-icon">{getRecommendationIcon(item.sentiment)}</span>
        <div className="rec-content">{formatText(item.text)}</div>
      </div>
    );
  }

  return (
    <p key={index}>{formatText(item.text)}</p>
  );
}

function formatText(text) {
  // Handle bold text marked with **
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length > 1) {
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  }
  return text;
}

export default AIResultDisplay;
