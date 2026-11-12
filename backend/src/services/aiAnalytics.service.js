const { queryAiReadonly } = require('../config/db');
const { formatCurrency } = require('../utils/format');

const formatIndianShort = (val) => {
  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  return formatCurrency(num, { decimals: 0 });
};

const detectLanguage = (text) => {
  const str = String(text || '');
  if (/[\u0900-\u097F]/.test(str)) {
    return 'hi';
  }
  const hinglishPattern =
    /\b(kitni|kitna|kitne|kaun|kya|batao|dikhao|mahina|mahine|pichle|agla|agle|sabse|zyada|kam|kahan|hui|huye|kaunsi|kaunsa|bikri|grahak|bhavishya|anuman|iske|aur|bhi|sirf|chahiye)\b/i;
  if (hinglishPattern.test(str)) {
    return 'hinglish';
  }
  return 'en';
};

const isCurrencyKey = (key) => {
  const lower = String(key || '').toLowerCase();
  if (
    lower.includes('count') ||
    lower.includes('percent') ||
    lower.includes('pct') ||
    lower.includes('orders') ||
    lower.includes('quantity') ||
    lower.includes('units') ||
    lower.includes('stock') ||
    lower.includes('rank') ||
    lower.includes('days')
  ) {
    return false;
  }
  return (
    lower.includes('revenue') ||
    lower.includes('spend') ||
    lower.includes('spent') ||
    lower.includes('amount') ||
    lower.includes('price') ||
    lower.includes('total') ||
    lower.includes('value') ||
    lower.includes('sales') ||
    lower.includes('forecast') ||
    lower.includes('predicted') ||
    lower.includes('change')
  );
};

const isNumericValue = (val) => {
  if (typeof val === 'number') return Number.isFinite(val);
  if (typeof val === 'string') {
    const clean = val.trim().replace(/₹|,/g, '');
    return clean !== '' && !Number.isNaN(Number(clean));
  }
  return false;
};

const inferChartConfig = (columns = [], rows = []) => {
  if (!Array.isArray(columns) || !Array.isArray(rows) || rows.length < 2 || columns.length < 2) {
    return null;
  }

  const labelCols = [];
  const metricCols = [];

  for (const col of columns) {
    const keyLower = col.key.toLowerCase();
    if (
      keyLower === 'id' ||
      keyLower.endsWith('_id') ||
      keyLower === 'rank' ||
      keyLower === 'rn' ||
      keyLower === 'row_number'
    ) {
      continue;
    }

    const sampleVals = rows
      .map((r) => r[col.key])
      .filter((v) => v !== null && v !== undefined && v !== '');

    const allNumeric = sampleVals.length > 0 && sampleVals.every(isNumericValue);
    if (allNumeric) {
      metricCols.push({
        key: col.key,
        label: col.label,
        isCurrency: isCurrencyKey(col.key),
      });
    } else {
      labelCols.push(col);
    }
  }

  if (labelCols.length === 0 || metricCols.length === 0) {
    return null;
  }

  const timeCol = labelCols.find((c) =>
    /^(month|week|day|date|sale_date|period|quarter|year|ym)$/i.test(c.key) ||
    /month|date|week|period|quarter/i.test(c.key)
  );
  const xCol = timeCol || labelCols[0];

  const primaryMetric =
    metricCols.find((m) => /revenue|total|amount|spent|sales|predicted/i.test(m.key)) ||
    metricCols[0];

  const hasTimePattern =
    Boolean(timeCol) ||
    rows.every((r) => /^\d{4}-\d{2}(-\d{2})?$/.test(String(r[xCol.key] || '').trim()));

  const hasNegative = rows.some((r) => {
    const v = Number(String(r[primaryMetric.key] ?? 0).replace(/₹|,/g, ''));
    return !Number.isNaN(v) && v < 0;
  });

  let chartType = 'bar';
  if (hasTimePattern) {
    chartType = 'line';
  } else if (
    rows.length <= 6 &&
    metricCols.length === 1 &&
    !hasNegative &&
    /status|category|brand|industry|customer_type|segment|city|state/i.test(xCol.key)
  ) {
    chartType = 'donut';
  }

  return {
    chartType,
    xKey: xCol.key,
    xLabel: xCol.label,
    yKeys: metricCols.slice(0, 2),
    supportedTypes: ['bar', 'line', 'donut'],
  };
};

const isForecastQuestion = (question) => {
  const q = String(question || '').toLowerCase();
  return /\b(predict|forecast|projection|projected|estimate next|next month revenue|upcoming month|agla mahina|bhavishya|anuman)\b/i.test(
    q
  ) || /(अनुमान|भविष्य|अगले महीने)/.test(q);
};

const buildFollowUpsAndRelated = ({
  columns = [],
  rows = [],
  language = 'en',
  intent = '',
}) => {
  const colKeys = columns.map((c) => c.key.toLowerCase());

  if (rows.length === 0) {
    if (language === 'hi') {
      return {
        followUps: [
          'पिछले महीने की कुल बिक्री कितनी थी?',
          'शहर के अनुसार बिक्री दिखाएं',
          'कम स्टॉक वाले उत्पाद कौन से हैं?',
        ],
        relatedQuestions: [
          'पिछले महीने की कुल बिक्री कितनी थी?',
          'सभी सक्रिय ग्राहकों की सूची दिखाएं',
        ],
      };
    }
    if (language === 'hinglish') {
      return {
        followUps: [
          'Pichle mahine total revenue kitna tha?',
          'City-wise sales dikhao',
          'Low stock products kaunse hain?',
        ],
        relatedQuestions: [
          'Pichle mahine total sales kitni hui?',
          'Top 5 customers by revenue dikhao',
        ],
      };
    }
    return {
      followUps: [
        'What were total sales in the current financial year?',
        'Show revenue by city and state',
        'Which active products are low on stock?',
      ],
      relatedQuestions: [
        'Show completed revenue by city across all time',
        'List active customers by industry and customer type',
      ],
    };
  }

  if (language === 'hi') {
    return {
      followUps: [
        'मासिक राजस्व ट्रेंड दिखाएं',
        'उद्योग के अनुसार ग्राहक राजस्व दिखाएं',
        'अगले महीने के राजस्व का अनुमान बताएं',
      ],
      relatedQuestions: [],
    };
  }
  if (language === 'hinglish') {
    return {
      followUps: [
        'Monthly revenue trend dikhao',
        'Industry-wise sales breakdown dikhao',
        'Agla mahina revenue predict karo',
      ],
      relatedQuestions: [],
    };
  }

  if (intent === 'FORECAST') {
    return {
      followUps: [
        'Show monthly revenue trend with MoM growth percentage',
        'Which categories drove revenue over the last 3 months?',
        'Which customers reduced their purchases recently?',
      ],
      relatedQuestions: [],
    };
  }

  if (colKeys.includes('city') || colKeys.includes('state')) {
    return {
      followUps: [
        'Break down this revenue by industry',
        'Show monthly revenue trend for these locations',
        'Which top 5 customers contribute most here?',
      ],
      relatedQuestions: [],
    };
  }

  if (colKeys.includes('product_name') || colKeys.includes('category') || colKeys.includes('brand')) {
    return {
      followUps: [
        'Which active products are low on stock?',
        'Show monthly revenue trend by category',
        'Compare revenue by brand across states',
      ],
      relatedQuestions: [],
    };
  }

  if (colKeys.includes('customer_name') || colKeys.includes('industry') || colKeys.includes('customer_type')) {
    return {
      followUps: [
        'Show revenue by customer type and industry',
        'Which customers have reduced their purchases recently?',
        'Show sales by state for this financial year',
      ],
      relatedQuestions: [],
    };
  }

  return {
    followUps: [
      'Break down completed revenue by industry',
      'Show monthly revenue trend with growth percentage',
      'Predict next month revenue',
    ],
    relatedQuestions: [],
  };
};

class AiAnalyticsService {
  detectLanguage(text) {
    return detectLanguage(text);
  }

  isForecastQuestion(question) {
    return isForecastQuestion(question);
  }

  inferChartConfig(columns, rows) {
    return inferChartConfig(columns, rows);
  }

  buildFollowUpsAndRelated(opts) {
    return buildFollowUpsAndRelated(opts);
  }

  formatIndianShort(val) {
    return formatIndianShort(val);
  }

  /**
   * Compute next-month revenue forecast in code using linear regression + 3-month moving average
   */
  async generateForecast(question) {
    const lang = detectLanguage(question);
    const sql = `SELECT TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month, COUNT(id)::int AS orders, ROUND(COALESCE(SUM(total_amount), 0), 2) AS revenue FROM ai_sales WHERE status = 'completed' GROUP BY 1 ORDER BY 1 ASC LIMIT 36`;
    const start = Date.now();
    const res = await queryAiReadonly(sql);
    const durationMs = Date.now() - start;

    const historyRows = (res.rows || []).map((r) => ({
      month: r.month,
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
      kind: 'Historical',
    }));

    const columns = [
      { key: 'month', label: 'Month' },
      { key: 'orders', label: 'Orders' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'kind', label: 'Type' },
    ];

    if (historyRows.length === 0) {
      const emptyFollowUps = buildFollowUpsAndRelated({
        columns,
        rows: [],
        language: lang,
        intent: 'FORECAST',
      });
      return {
        intent: 'FORECAST',
        reportTitle: 'Revenue Forecast (Estimate)',
        answer:
          lang === 'hi'
            ? 'अनुमान लगाने के लिए पर्याप्त पूर्ण बिक्री डेटा उपलब्ध नहीं है।'
            : lang === 'hinglish'
            ? 'Forecast nikalne ke liye abhi completed sales data available nahi hai.'
            : 'There is not enough completed historical sales data yet to compute a revenue estimate.',
        columns,
        rows: [],
        summaryMetrics: { rowsShown: 0 },
        chartConfig: null,
        sql,
        assumptions: 'Completed sales orders grouped by calendar month (Estimate model unavailable with 0 historical months)',
        followUps: emptyFollowUps.followUps,
        relatedQuestions: emptyFollowUps.relatedQuestions,
        isEstimate: true,
        durationMs,
        rowCount: 0,
      };
    }

    const n = historyRows.length;
    const recentSlice = historyRows.slice(-Math.min(3, n));
    const movingAvg3M =
      recentSlice.reduce((sum, r) => sum + r.revenue, 0) / recentSlice.length;

    let slope = 0;
    let intercept = movingAvg3M;
    if (n >= 2) {
      const sumX = (n * (n - 1)) / 2;
      const sumY = historyRows.reduce((acc, r) => acc + r.revenue, 0);
      const sumXY = historyRows.reduce((acc, r, idx) => acc + idx * r.revenue, 0);
      const sumX2 = historyRows.reduce((acc, _, idx) => acc + idx * idx, 0);
      const denom = n * sumX2 - sumX * sumX;
      if (denom !== 0) {
        slope = (n * sumXY - sumX * sumY) / denom;
        intercept = (sumY - slope * sumX) / n;
      }
    }

    const linearNext = Math.max(0, intercept + slope * n);
    // Blend 60% 3-month moving average + 40% linear trend to dampen outlier spikes
    const predictedRevenue = Number(Math.max(0, movingAvg3M * 0.6 + linearNext * 0.4).toFixed(2));
    const avgOrders = Math.max(
      1,
      Math.round(recentSlice.reduce((sum, r) => sum + r.orders, 0) / recentSlice.length)
    );

    const lastMonthStr = historyRows[n - 1].month;
    const [lastY, lastM] = lastMonthStr.split('-').map(Number);
    const nextDate = new Date(Date.UTC(lastY, lastM, 1));
    const nextMonthStr = `${nextDate.getUTCFullYear()}-${String(
      nextDate.getUTCMonth() + 1
    ).padStart(2, '0')}`;

    const combinedRows = [
      ...historyRows,
      {
        month: `${nextMonthStr} (Est.)`,
        orders: avgOrders,
        revenue: predictedRevenue,
        kind: 'Estimate',
      },
    ];

    const formattedPred = `${formatCurrency(predictedRevenue, { decimals: 0 })} (${formatIndianShort(
      predictedRevenue
    )})`;
    const formattedMa = formatCurrency(movingAvg3M, { decimals: 0 });
    const trendLabel = slope >= 0 ? 'upward' : 'downward';

    let answer;
    if (lang === 'hi') {
      answer = `अनुमान (Estimate): ${nextMonthStr} के लिए अनुमानित राजस्व लगभग ${formattedPred} है (पिछले ${recentSlice.length} महीनों के औसत ${formattedMa} और ${n} महीनों के ट्रेंड के आधार पर)। यह केवल ऐतिहासिक डेटा पर आधारित एक सांख्यिकीय अनुमान है।`;
    } else if (lang === 'hinglish') {
      answer = `Estimate: ${nextMonthStr} ke liye predicted revenue lagbhag ${formattedPred} hai (last ${recentSlice.length}-month average ${formattedMa} aur ${n}-month ${trendLabel} trend ke base par). Note: yeh sirf historical completed orders ka statistical estimate hai.`;
    } else {
      answer = `Estimate: Projected revenue for ${nextMonthStr} is ${formattedPred}, blended from the ${recentSlice.length}-month moving average (${formattedMa}) and an ${trendLabel} linear trend across ${n} historical month${n === 1 ? '' : 's'}. This projection is a statistical estimate based solely on past completed orders.`;
    }

    const followUpsObj = buildFollowUpsAndRelated({
      columns,
      rows: combinedRows,
      language: lang,
      intent: 'FORECAST',
    });

    return {
      intent: 'FORECAST',
      reportTitle: `Monthly Revenue & ${nextMonthStr} Forecast (Estimate)`,
      answer,
      columns,
      rows: combinedRows,
      summaryMetrics: {
        estimatedNextMonthRevenue: predictedRevenue,
        movingAverage3M: Number(movingAvg3M.toFixed(2)),
        historicalMonths: n,
        isEstimate: 'Yes (Trend + 3M Moving Avg)',
      },
      chartConfig: {
        chartType: 'line',
        xKey: 'month',
        xLabel: 'Month',
        yKeys: [{ key: 'revenue', label: 'Revenue', isCurrency: true }],
        supportedTypes: ['line', 'bar'],
      },
      sql,
      assumptions: `Estimate model (60% ${recentSlice.length}-month moving average + 40% linear trend) computed over ${n} completed monthly buckets; clearly labelled as an estimate.`,
      followUps: followUpsObj.followUps,
      relatedQuestions: [],
      isEstimate: true,
      durationMs,
      rowCount: combinedRows.length,
    };
  }

  /**
   * Generate 5 automatic executive insights directly from ai_* views
   */
  async generateFiveInsights(language = 'en') {
    const start = Date.now();

    const growthSql = `
      WITH recent AS (
        SELECT p.category, COALESCE(SUM(si.line_total), 0) AS rev
        FROM ai_sale_items si
        JOIN ai_sales s ON s.id = si.sale_id
        JOIN ai_products p ON p.id = si.product_id
        WHERE s.status = 'completed' AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.category
      ),
      prior AS (
        SELECT p.category, COALESCE(SUM(si.line_total), 0) AS rev
        FROM ai_sale_items si
        JOIN ai_sales s ON s.id = si.sale_id
        JOIN ai_products p ON p.id = si.product_id
        WHERE s.status = 'completed'
          AND s.sale_date >= CURRENT_DATE - INTERVAL '60 days'
          AND s.sale_date < CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.category
      ),
      overall AS (
        SELECT p.category, ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_rev
        FROM ai_sale_items si
        JOIN ai_sales s ON s.id = si.sale_id
        JOIN ai_products p ON p.id = si.product_id
        WHERE s.status = 'completed'
        GROUP BY p.category
      )
      SELECT
        o.category,
        o.total_rev,
        ROUND(COALESCE(r.rev, 0), 2) AS recent_rev,
        ROUND(COALESCE(pr.rev, 0), 2) AS prior_rev,
        ROUND(COALESCE(r.rev, 0) - COALESCE(pr.rev, 0), 2) AS rev_diff
      FROM overall o
      LEFT JOIN recent r ON r.category = o.category
      LEFT JOIN prior pr ON pr.category = o.category
      ORDER BY rev_diff DESC, o.total_rev DESC
      LIMIT 5
    `;

    const dropSql = `
      WITH recent_c AS (
        SELECT customer_id, COALESCE(SUM(total_amount), 0) AS rev
        FROM ai_sales
        WHERE status = 'completed' AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY customer_id
      ),
      prior_c AS (
        SELECT customer_id, COALESCE(SUM(total_amount), 0) AS rev
        FROM ai_sales
        WHERE status = 'completed'
          AND sale_date >= CURRENT_DATE - INTERVAL '60 days'
          AND sale_date < CURRENT_DATE - INTERVAL '30 days'
        GROUP BY customer_id
      )
      SELECT
        c.customer_name,
        c.city,
        ROUND(p.rev, 2) AS prior_30d,
        ROUND(COALESCE(r.rev, 0), 2) AS recent_30d,
        ROUND(COALESCE(r.rev, 0) - p.rev, 2) AS spend_change
      FROM ai_customers c
      JOIN prior_c p ON p.customer_id = c.id
      LEFT JOIN recent_c r ON r.customer_id = c.id
      WHERE COALESCE(r.rev, 0) < p.rev
      ORDER BY spend_change ASC
      LIMIT 5
    `;

    const atRiskSql = `
      SELECT
        c.customer_name,
        c.city,
        c.status,
        MAX(s.sale_date)::text AS last_order_date,
        COUNT(s.id)::int AS completed_orders,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS lifetime_spend
      FROM ai_customers c
      LEFT JOIN ai_sales s ON s.customer_id = c.id AND s.status = 'completed'
      GROUP BY c.id, c.customer_name, c.city, c.status
      HAVING MAX(s.sale_date) IS NULL OR MAX(s.sale_date) < CURRENT_DATE - INTERVAL '30 days'
      ORDER BY lifetime_spend DESC
      LIMIT 5
    `;

    const lowStockSql = `
      SELECT
        product_name,
        category,
        stock_quantity::int AS stock_quantity,
        reorder_level::int AS reorder_level
      FROM ai_products
      WHERE is_active = true AND stock_quantity <= reorder_level
      ORDER BY stock_quantity ASC, product_name ASC
      LIMIT 5
    `;

    const spikeSql = `
      WITH stats AS (
        SELECT COALESCE(AVG(total_amount), 0) AS avg_amt
        FROM ai_sales
        WHERE status = 'completed'
      )
      SELECT
        s.id AS sale_id,
        c.customer_name,
        s.sale_date::text AS sale_date,
        ROUND(s.total_amount, 2) AS total_amount,
        ROUND(st.avg_amt, 2) AS avg_order_value
      FROM ai_sales s
      JOIN ai_customers c ON c.id = s.customer_id
      CROSS JOIN stats st
      WHERE s.status = 'completed'
      ORDER BY s.total_amount DESC
      LIMIT 3
    `;

    const [growthRes, dropRes, atRiskRes, lowStockRes, spikeRes] = await Promise.all([
      queryAiReadonly(growthSql),
      queryAiReadonly(dropSql),
      queryAiReadonly(atRiskSql),
      queryAiReadonly(lowStockSql),
      queryAiReadonly(spikeSql),
    ]);

    const durationMs = Date.now() - start;

    const topGrowth = growthRes.rows?.[0];
    const biggestDrop = dropRes.rows?.[0];
    const atRiskCount = atRiskRes.rows?.length || 0;
    const topAtRisk = atRiskRes.rows?.[0];
    const lowStockCount = lowStockRes.rows?.length || 0;
    const criticalStock = lowStockRes.rows?.[0];
    const topSpike = spikeRes.rows?.[0];

    const insightRows = [
      {
        insight: 'Top Growth Category',
        subject: topGrowth ? topGrowth.category : 'No recent orders',
        metric_value: topGrowth ? Number(topGrowth.total_rev || 0) : 0,
        detail: topGrowth
          ? Number(topGrowth.rev_diff) > 0
            ? `+${formatCurrency(topGrowth.rev_diff)} vs prior 30 days (Total: ${formatCurrency(topGrowth.total_rev)})`
            : `Leading category with ${formatCurrency(topGrowth.total_rev)} lifetime completed revenue`
          : 'No completed sales data found',
      },
      {
        insight: 'Biggest Drop',
        subject: biggestDrop ? `${biggestDrop.customer_name} (${biggestDrop.city})` : 'No 30d decline detected',
        metric_value: biggestDrop ? Number(biggestDrop.spend_change || 0) : 0,
        detail: biggestDrop
          ? `Dropped by ${formatCurrency(Math.abs(biggestDrop.spend_change))} (prior 30d: ${formatCurrency(biggestDrop.prior_30d)} -> recent 30d: ${formatCurrency(biggestDrop.recent_30d)})`
          : 'No customer spend declined between the prior 30d and recent 30d windows',
      },
      {
        insight: 'At-Risk Customers',
        subject: topAtRisk ? `${atRiskCount} inactive / 30d+ dormant (Top: ${topAtRisk.customer_name})` : '0 at-risk customers',
        metric_value: topAtRisk ? Number(topAtRisk.lifetime_spend || 0) : 0,
        detail: topAtRisk
          ? `${topAtRisk.customer_name} (${topAtRisk.city}) has ${formatCurrency(topAtRisk.lifetime_spend)} lifetime spend; last order: ${topAtRisk.last_order_date || 'Never'}`
          : 'All customers ordered within the last 30 days',
      },
      {
        insight: 'Low Stock Alert',
        subject: criticalStock ? `${lowStockCount} product(s) <= reorder level (${criticalStock.product_name})` : 'Inventory healthy',
        metric_value: criticalStock ? Number(criticalStock.stock_quantity || 0) : 0,
        detail: criticalStock
          ? `${criticalStock.product_name} has ${criticalStock.stock_quantity} left (reorder level: ${criticalStock.reorder_level})`
          : 'No active products are at or below reorder level',
      },
      {
        insight: 'Unusual / Peak Order',
        subject: topSpike ? `Sale #${topSpike.sale_id} (${topSpike.customer_name})` : 'No completed sales',
        metric_value: topSpike ? Number(topSpike.total_amount || 0) : 0,
        detail: topSpike
          ? `Peak order of ${formatCurrency(topSpike.total_amount)} on ${topSpike.sale_date} vs average order value ${formatCurrency(topSpike.avg_order_value)}`
          : 'No completed orders available',
      },
    ];

    const summaryLines = insightRows.map(
      (item, idx) => `${idx + 1}. ${item.insight}: ${item.subject} — ${item.detail}`
    );

    const intro =
      language === 'hi'
        ? 'आपके डेटाबेस से 5 प्रमुख बिज़नेस इनसाइट्स:'
        : language === 'hinglish'
        ? 'Aapke live data se 5 key business insights:'
        : 'Here are 5 key executive insights from your current data:';

    const columns = [
      { key: 'insight', label: 'Insight' },
      { key: 'subject', label: 'Subject' },
      { key: 'metric_value', label: 'Key Metric' },
      { key: 'detail', label: 'Details' },
    ];

    return {
      intent: 'INSIGHTS',
      reportTitle: 'Automated 5 Key Business Insights',
      answer: `${intro}\n\n${summaryLines.join('\n')}`,
      columns,
      rows: insightRows,
      summaryMetrics: {
        insightsGenerated: 5,
        atRiskCustomers: atRiskCount,
        lowStockProducts: lowStockCount,
      },
      chartConfig: {
        chartType: 'bar',
        xKey: 'insight',
        xLabel: 'Insight',
        yKeys: [{ key: 'metric_value', label: 'Metric Value', isCurrency: false }],
        supportedTypes: ['bar', 'line'],
      },
      sql: `${growthSql.trim()} /* + 4 read-only insight checks on ai_* views */`,
      assumptions: 'Computed across ai_sales (completed orders), ai_customers, ai_products, and ai_sale_items comparing recent 30d vs prior 30d and active stock thresholds.',
      followUps: [
        'Which customers have reduced their purchases recently?',
        'Which active products are low on stock?',
        'Predict next month revenue',
      ],
      relatedQuestions: [],
      durationMs,
      rowCount: insightRows.length,
    };
  }
}

module.exports = new AiAnalyticsService();

