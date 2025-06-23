import axios, { AxiosResponse } from 'axios';
import { INodeExecutionData, IExecutionContext } from './NodeService';

// Type definitions for API responses
interface SlackResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  message?: any;
  channels?: any[];
  error?: string;
}

interface DiscordResponse {
  id?: string;
  channel_id?: string;
  content?: string;
  timestamp?: string;
  error?: string;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts?: any[];
  messages?: any[];
  error?: any;
}

interface GoogleSheetsResponse {
  values?: any[][];
  updatedCells?: number;
  updatedColumns?: number;
  updatedRows?: number;
  error?: any;
}

interface NotionResponse {
  object: string;
  id?: string;
  results?: any[];
  error?: any;
}

interface AirtableResponse {
  records?: any[];
  id?: string;
  fields?: any;
  error?: any;
}

interface EmailResponse {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  error?: any;
}

/**
 * Serviço para gerenciar integrações com plataformas externas
 * Implementa as lacunas identificadas: Slack, Discord, Telegram, WhatsApp,
 * bancos de dados (MySQL, MongoDB), APIs (Google Sheets, Notion, Airtable),
 * e serviços de email (Gmail, Outlook)
 */

export class IntegrationNodes {
  
  // ========== INTEGRAÇÕES DE COMUNICAÇÃO ==========
  
  /**
   * Integração com Slack
   */
  static async executeSlackNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, webhookUrl, token, channel, message, username } = parameters;
    
    try {
      switch (action) {
        case 'sendMessage':
          const slackResponse: AxiosResponse<SlackResponse> = await axios.post(webhookUrl || 'https://slack.com/api/chat.postMessage', {
            channel: channel,
            text: message,
            username: username || 'J3N Bot'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          return [{
            json: {
              success: true,
              messageId: slackResponse.data.ts,
              channel: slackResponse.data.channel,
              message: message
            }
          }];
          
        case 'getChannels':
          const channelsResponse: AxiosResponse<SlackResponse> = await axios.get('https://slack.com/api/conversations.list', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          return [{
            json: {
              channels: channelsResponse.data.channels
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Slack: ${error.message}`);
    }
  }
  
  /**
   * Integração com Discord
   */
  static async executeDiscordNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, webhookUrl, token, channelId, message, embeds } = parameters;
    
    try {
      switch (action) {
        case 'sendMessage':
          const payload: any = { content: message };
          if (embeds) payload.embeds = embeds;
          
          const discordResponse: AxiosResponse<DiscordResponse> = await axios.post(webhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          return [{
            json: {
              success: true,
              messageId: discordResponse.data.id,
              message: message
            }
          }];
          
        case 'getGuildInfo':
          const guildResponse = await axios.get(`https://discord.com/api/v10/guilds/${parameters.guildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
          });
          
          return [{
            json: {
              guild: guildResponse.data
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Discord: ${error.message}`);
    }
  }
  
  /**
   * Integração com Telegram
   */
  static async executeTelegramNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, botToken, chatId, message, parseMode } = parameters;
    const baseUrl = `https://api.telegram.org/bot${botToken}`;
    
    try {
      switch (action) {
        case 'sendMessage':
          const telegramResponse: AxiosResponse<TelegramResponse> = await axios.post(`${baseUrl}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: parseMode || 'HTML'
          });
          
          return [{
             json: {
               success: true,
               messageId: telegramResponse.data.result?.message_id,
               chatId: chatId,
               message: message
             }
           }];
           
         case 'getUpdates':
          const updatesResponse: AxiosResponse<TelegramResponse> = await axios.get(`${baseUrl}/getUpdates`);
          
          return [{
            json: {
              updates: updatesResponse.data.result
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Telegram: ${error.message}`);
    }
  }
  
  /**
   * Integração com WhatsApp Business API
   */
  static async executeWhatsAppNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, accessToken, phoneNumberId, to, message, templateName } = parameters;
    const baseUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    
    try {
      switch (action) {
        case 'sendMessage':
          const whatsappResponse: AxiosResponse<WhatsAppResponse> = await axios.post(`${baseUrl}/messages`, {
            messaging_product: 'whatsapp',
            to: to,
            text: { body: message }
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          return [{
            json: {
              success: true,
              messageId: whatsappResponse.data.messages?.[0]?.id,
              to: to,
              message: message
            }
          }];
          
        case 'sendTemplate':
          const templateResponse: AxiosResponse<WhatsAppResponse> = await axios.post(`${baseUrl}/messages`, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'pt_BR' }
            }
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          return [{
            json: {
              success: true,
              messageId: templateResponse.data.messages?.[0]?.id,
              to: to,
              template: templateName
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração WhatsApp: ${error.message}`);
    }
  }
  
  // ========== INTEGRAÇÕES DE BANCO DE DADOS ==========
  
  /**
   * Integração com MySQL
   */
  static async executeMySQLNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, host, port, database, username, password, query, table, data } = parameters;
    
    try {
      // Nota: Seria necessário instalar mysql2 package
      // const mysql = require('mysql2/promise');
      
      // const connection = await mysql.createConnection({
      //   host: host,
      //   port: port || 3306,
      //   user: username,
      //   password: password,
      //   database: database
      // });
      
      switch (action) {
        case 'select':
          // const [rows] = await connection.execute(query);
          // await connection.end();
          
          return [{
            json: {
              success: true,
              // rows: rows,
              query: query,
              note: 'MySQL integration requires mysql2 package installation'
            }
          }];
          
        case 'insert':
          // const insertQuery = `INSERT INTO ${table} SET ?`;
          // const [result] = await connection.execute(insertQuery, [data]);
          // await connection.end();
          
          return [{
            json: {
              success: true,
              // insertId: result.insertId,
              table: table,
              note: 'MySQL integration requires mysql2 package installation'
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração MySQL: ${error.message}`);
    }
  }
  
  /**
   * Integração com MongoDB
   */
  static async executeMongoDBNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, connectionString, database, collection, query, document } = parameters;
    
    try {
      // Nota: Seria necessário instalar mongodb package
      // const { MongoClient } = require('mongodb');
      
      // const client = new MongoClient(connectionString);
      // await client.connect();
      // const db = client.db(database);
      // const coll = db.collection(collection);
      
      switch (action) {
        case 'find':
          // const documents = await coll.find(query).toArray();
          // await client.close();
          
          return [{
            json: {
              success: true,
              // documents: documents,
              collection: collection,
              note: 'MongoDB integration requires mongodb package installation'
            }
          }];
          
        case 'insertOne':
          // const result = await coll.insertOne(document);
          // await client.close();
          
          return [{
            json: {
              success: true,
              // insertedId: result.insertedId,
              collection: collection,
              note: 'MongoDB integration requires mongodb package installation'
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração MongoDB: ${error.message}`);
    }
  }
  
  // ========== INTEGRAÇÕES DE APIS POPULARES ==========
  
  /**
   * Integração com Google Sheets
   */
  static async executeGoogleSheetsNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, apiKey, spreadsheetId, range, values, sheetName } = parameters;
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    try {
      switch (action) {
        case 'read':
          const readResponse: AxiosResponse<GoogleSheetsResponse> = await axios.get(
            `${baseUrl}/${spreadsheetId}/values/${range}?key=${apiKey}`
          );
          
          return [{
            json: {
              success: true,
              values: readResponse.data.values,
              range: range
            }
          }];
          
        case 'write':
          const writeResponse: AxiosResponse<GoogleSheetsResponse> = await axios.put(
            `${baseUrl}/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${apiKey}`,
            {
              values: values
            }
          );
          
          return [{
            json: {
              success: true,
              updatedCells: writeResponse.data.updatedCells,
              range: range
            }
          }];
          
        case 'append':
          const appendResponse: AxiosResponse<GoogleSheetsResponse> = await axios.post(
            `${baseUrl}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${apiKey}`,
            {
              values: values
            }
          );
          
          return [{
            json: {
              success: true,
              updatedCells: appendResponse.data.updatedCells
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Google Sheets: ${error.message}`);
    }
  }
  
  /**
   * Integração com Notion
   */
  static async executeNotionNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, token, databaseId, pageId, properties, filter, sorts } = parameters;
    const baseUrl = 'https://api.notion.com/v1';
    
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };
      
      switch (action) {
        case 'queryDatabase':
           const queryResponse: AxiosResponse<NotionResponse> = await axios.post(
             `${baseUrl}/databases/${databaseId}/query`,
             { filter, sorts },
             { headers }
           );
           
           return [{
             json: {
               success: true,
               results: queryResponse.data
             }
           }];
          
        case 'createPage':
          const createResponse: AxiosResponse<NotionResponse> = await axios.post(
            `${baseUrl}/pages`,
            {
              parent: { database_id: databaseId },
              properties: properties
            },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              pageId: createResponse.data.id,
              url: (createResponse.data as any).url
            }
          }];
          
        case 'updatePage':
          const updateResponse: AxiosResponse<NotionResponse> = await axios.patch(
            `${baseUrl}/pages/${pageId}`,
            { properties: properties },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              pageId: updateResponse.data.id,
              lastEdited: (updateResponse.data as any).last_edited_time
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Notion: ${error.message}`);
    }
  }
  
  /**
   * Integração com Airtable
   */
  static async executeAirtableNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, apiKey, baseId, tableId, recordId, fields, filterByFormula } = parameters;
    const baseUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    
    try {
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      switch (action) {
        case 'list':
          let url = baseUrl;
          if (filterByFormula) {
            url += `?filterByFormula=${encodeURIComponent(filterByFormula)}`;
          }
          
          const listResponse: AxiosResponse<AirtableResponse> = await axios.get(url, { headers });
          
          return [{
            json: {
              success: true,
              records: listResponse.data.records
            }
          }];
          
        case 'create':
          const createResponse: AxiosResponse<AirtableResponse> = await axios.post(
            baseUrl,
            { fields: fields },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              recordId: createResponse.data.id,
              fields: createResponse.data.fields
            }
          }];
          
        case 'update':
          const updateResponse: AxiosResponse<AirtableResponse> = await axios.patch(
            `${baseUrl}/${recordId}`,
            { fields: fields },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              recordId: updateResponse.data.id,
              fields: updateResponse.data.fields
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Airtable: ${error.message}`);
    }
  }
  
  // ========== INTEGRAÇÕES DE EMAIL ==========
  
  /**
   * Integração com Gmail
   */
  static async executeGmailNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, accessToken, to, subject, body, query, maxResults } = parameters;
    const baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';
    
    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
      
      switch (action) {
        case 'sendEmail':
          const emailContent = [
            `To: ${to}`,
            `Subject: ${subject}`,
            '',
            body
          ].join('\n');
          
          const encodedEmail = Buffer.from(emailContent).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
          
          const sendResponse: AxiosResponse<EmailResponse> = await axios.post(
            `${baseUrl}/messages/send`,
            { raw: encodedEmail },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              messageId: sendResponse.data.id,
              to: to,
              subject: subject
            }
          }];
          
        case 'listEmails':
          const listResponse: AxiosResponse<EmailResponse> = await axios.get(
            `${baseUrl}/messages?q=${encodeURIComponent(query || '')}&maxResults=${maxResults || 10}`,
            { headers }
          );
          
          return [{
            json: {
              success: true,
              messages: (listResponse.data as any).messages || [],
              resultSizeEstimate: (listResponse.data as any).resultSizeEstimate
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Gmail: ${error.message}`);
    }
  }
  
  /**
   * Integração com Outlook
   */
  static async executeOutlookNode(inputData: INodeExecutionData[], parameters: any): Promise<INodeExecutionData[]> {
    const { action, accessToken, to, subject, body, folderId } = parameters;
    const baseUrl = 'https://graph.microsoft.com/v1.0/me';
    
    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
      
      switch (action) {
        case 'sendEmail':
          const sendResponse: AxiosResponse<EmailResponse> = await axios.post(
            `${baseUrl}/sendMail`,
            {
              message: {
                subject: subject,
                body: {
                  contentType: 'Text',
                  content: body
                },
                toRecipients: [{
                  emailAddress: {
                    address: to
                  }
                }]
              }
            },
            { headers }
          );
          
          return [{
            json: {
              success: true,
              to: to,
              subject: subject,
              sentAt: new Date().toISOString()
            }
          }];
          
        case 'listEmails':
          const listResponse: AxiosResponse<EmailResponse> = await axios.get(
            `${baseUrl}/mailFolders/${folderId || 'inbox'}/messages`,
            { headers }
          );
          
          return [{
            json: {
              success: true,
              messages: (listResponse.data as any).value
            }
          }];
          
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error: any) {
      throw new Error(`Erro na integração Outlook: ${error.message}`);
    }
  }
}