declare module 'reactflow' {
  import * as React from 'react';
  
  // Extend the original React Flow types
  export * from 'reactflow/dist/esm/types';
  
  // Add custom types here if needed
  export interface CustomNodeData {
    label?: string;
    [key: string]: any;
  }
}