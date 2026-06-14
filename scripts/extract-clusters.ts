import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clusters = {
  'Auction viewing': ['exp_002', 'exp_140'],
  'Large house with friends': ['exp_022', 'exp_068'],
  'Build something for a friend': ['exp_046', 'exp_133'],
  'Rucking together': ['exp_067', 'exp_113'],
  'Jazz/folk session alone': ['exp_006', 'exp_077'],
  'Wild swimming': ['exp_103', 'exp_139', 'exp_168'],
  'Parents place that mattered': ['exp_018', 'exp_088'],
  'Record family stories': ['exp_041', 'exp_042']
};

function main() {
  const experiencesPath = path.join(__dirname, '../src/ui/experience/data/experiences.json');
  const data = JSON.parse(fs.readFileSync(experiencesPath, 'utf-8'));
  
  const allIds = Object.values(clusters).flat();
  const entries: Record<string, any> = {};
  
  for (const exp of data.experiences) {
    if (allIds.includes(exp.id)) {
      entries[exp.id] = exp;
    }
  }
  
  console.log('# Near-duplicate clusters for editorial review\n');
  
  for (const [clusterName, ids] of Object.entries(clusters)) {
    console.log(`## ${clusterName}\n`);
    
    for (const id of ids) {
      const exp = entries[id];
      if (!exp) {
        console.log(`ERROR: ${id} not found\n`);
        continue;
      }
      
      console.log('```json');
      console.log(JSON.stringify(exp, null, 2));
      console.log('```\n');
    }
  }
}

main();
