#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

interface PageSpeedInsight {
    score: number;
    title: string;
    description: string;
    displayValue?: string;
}

interface ProcessedPageSpeedResult {
    performanceScore: number;
    insights: PageSpeedInsight[];
    loadingExperience: {
        firstContentfulPaint: {
            category: string;
            percentile: number;
        };
        firstInputDelay: {
            category: string;
            percentile: number;
        };
    };
}

class PageSpeedServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'pagespeed-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'analyze_pagespeed',
                    description: 'Analyzes a webpage using Google PageSpeed Insights API',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'The URL to analyze'
                            }
                        },
                        required: ['url']
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === 'analyze_pagespeed') {
                const { url } = request.params.arguments as { url: string };

                try {
                    const response = await axios.get<any>(
                        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}`
                    );

                    const result = response.data;
                    const processedResult: ProcessedPageSpeedResult = {
                        performanceScore: Math.round(result.lighthouseResult.categories.performance.score * 100),
                        insights: [],
                        loadingExperience: {
                            firstContentfulPaint: {
                                category: result.loadingExperience?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.category || 'N/A',
                                percentile: result.loadingExperience?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.percentile || 0
                            },
                            firstInputDelay: {
                                category: result.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.category || 'N/A',
                                percentile: result.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile || 0
                            }
                        }
                    };

                    // Process audits and extract insights
                    const audits = result.lighthouseResult.audits;
                    for (const [key, audit] of Object.entries(audits)) {
                        const typedAudit = audit as any;
                        if (typedAudit.score !== null && typedAudit.score < 1) {
                            processedResult.insights.push({
                                score: typedAudit.score,
                                title: typedAudit.title,
                                description: typedAudit.description,
                                displayValue: typedAudit.displayValue
                            });
                        }
                    }

                    // Sort insights by score (lowest first)
                    processedResult.insights.sort((a, b) => a.score - b.score);

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    summary: `Your page performance score is ${processedResult.performanceScore}/100`,
                                    loadingExperience: {
                                        firstContentfulPaint: `${processedResult.loadingExperience.firstContentfulPaint.category} (${processedResult.loadingExperience.firstContentfulPaint.percentile}ms)`,
                                        firstInputDelay: `${processedResult.loadingExperience.firstInputDelay.category} (${processedResult.loadingExperience.firstInputDelay.percentile}ms)`
                                    },
                                    topImprovements: processedResult.insights.slice(0, 5).map(insight => ({
                                        title: insight.title,
                                        description: insight.description,
                                        impact: Math.round((1 - insight.score) * 100) + '% improvement possible',
                                        currentValue: insight.displayValue
                                    }))
                                }, null, 2)
                            }
                        ]
                    };
                } catch (error) {
                    console.error('Error analyzing URL:', error);
                    throw {
                        code: ErrorCode.InternalError,
                        message: 'Failed to analyze URL',
                        details: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }

            throw {
                code: ErrorCode.MethodNotFound,
                message: `Unknown tool: ${request.params.name}`
            };
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('PageSpeed MCP server running on stdio');
    }
}

const server = new PageSpeedServer();
server.run().catch(console.error); 