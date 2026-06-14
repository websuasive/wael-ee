import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_NARROWINGS = [
  'structural',
  'experiential',
  'psychological',
  'identity',
  'energetic',
  'relational',
  'attention'
];

interface Assignment {
  id: string;
  narrowings: string[];
  confidence: string;
}

interface ValidationError {
  id: string;
  reason: string;
}

function parseAssignments(markdownPath: string): Assignment[] {
  const content = fs.readFileSync(markdownPath, 'utf-8');
  const assignments: Assignment[] = [];
  
  const lines = content.split('\n');
  let currentAssignment: Partial<Assignment> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('id: exp_')) {
      if (currentAssignment && currentAssignment.id) {
        assignments.push(currentAssignment as Assignment);
      }
      currentAssignment = {
        id: line.substring(4).trim(),
        narrowings: [],
        confidence: ''
      };
    } else if (line.startsWith('narrowings: ')) {
      if (currentAssignment) {
        const narrowingsStr = line.substring(12).trim();
        try {
          currentAssignment.narrowings = JSON.parse(narrowingsStr);
        } catch (e) {
          console.error(`Failed to parse narrowings for ${currentAssignment.id}: ${narrowingsStr}`);
          currentAssignment.narrowings = [];
        }
      }
    } else if (line.startsWith('confidence: ')) {
      if (currentAssignment) {
        currentAssignment.confidence = line.substring(12).trim();
      }
    }
  }
  
  if (currentAssignment && currentAssignment.id) {
    assignments.push(currentAssignment as Assignment);
  }
  
  return assignments;
}

function validateAssignment(assignment: Assignment, experiencesData: any): ValidationError | null {
  const experience = experiencesData.experiences.find((e: any) => e.id === assignment.id);
  
  if (!experience) {
    return { id: assignment.id, reason: 'ID does not exist in experiences.json' };
  }
  
  if (assignment.narrowings.length > 3) {
    return { id: assignment.id, reason: `Array length ${assignment.narrowings.length} exceeds maximum of 3` };
  }
  
  for (const narrowing of assignment.narrowings) {
    if (!CANONICAL_NARROWINGS.includes(narrowing)) {
      return { id: assignment.id, reason: `Invalid narrowing value: "${narrowing}"` };
    }
  }
  
  const uniqueNarrowings = new Set(assignment.narrowings);
  if (uniqueNarrowings.size !== assignment.narrowings.length) {
    return { id: assignment.id, reason: 'Duplicate values in narrowings array' };
  }
  
  return null;
}

function main() {
  const assignmentsPath = path.join(__dirname, '../src/narrowings-assignments-pass.md');
  const experiencesPath = path.join(__dirname, '../src/ui/experience/data/experiences.json');
  
  console.log('Parsing assignments from:', assignmentsPath);
  const assignments = parseAssignments(assignmentsPath);
  console.log(`Parsed ${assignments.length} assignment blocks`);
  
  console.log('\nReading experiences.json...');
  const experiencesData = JSON.parse(fs.readFileSync(experiencesPath, 'utf-8'));
  console.log(`Found ${experiencesData.experiences.length} experience entries`);
  
  console.log('\nValidating assignments...');
  const validationErrors: ValidationError[] = [];
  const validAssignments: Assignment[] = [];
  
  for (const assignment of assignments) {
    const error = validateAssignment(assignment, experiencesData);
    if (error) {
      validationErrors.push(error);
    } else {
      validAssignments.push(assignment);
    }
  }
  
  if (validationErrors.length > 0) {
    console.error(`\n❌ Validation failed for ${validationErrors.length} assignments:`);
    for (const error of validationErrors) {
      console.error(`  - ${error.id}: ${error.reason}`);
    }
    
    const failureRate = (validationErrors.length / assignments.length) * 100;
    if (failureRate > 5) {
      console.error(`\n❌ Failure rate ${failureRate.toFixed(1)}% exceeds 5% threshold. Stopping.`);
      process.exit(1);
    }
  }
  
  console.log(`\n✓ ${validAssignments.length} assignments validated successfully`);
  
  console.log('\nApplying narrowings to experiences.json...');
  let appliedCount = 0;
  
  for (const assignment of validAssignments) {
    const experience = experiencesData.experiences.find((e: any) => e.id === assignment.id);
    if (experience) {
      experience.narrowings = assignment.narrowings;
      appliedCount++;
    }
  }
  
  console.log(`Applied narrowings to ${appliedCount} entries`);
  
  const missingAssignments = experiencesData.experiences.filter(
    (e: any) => !assignments.find(a => a.id === e.id)
  );
  
  if (missingAssignments.length > 0) {
    console.log(`\n⚠ ${missingAssignments.length} entries did not receive assignments:`);
    for (const exp of missingAssignments) {
      console.log(`  - ${exp.id}: ${exp.name}`);
    }
  }
  
  console.log('\nWriting updated experiences.json...');
  fs.writeFileSync(experiencesPath, JSON.stringify(experiencesData, null, 2) + '\n', 'utf-8');
  
  console.log('\n✓ Write complete');
  
  try {
    JSON.parse(fs.readFileSync(experiencesPath, 'utf-8'));
    console.log('✓ JSON syntax validation passed');
  } catch (e) {
    console.error('❌ JSON syntax validation failed!');
    console.error('Restoring from backup...');
    fs.copyFileSync(
      path.join(__dirname, '../src/ui/experience/data/experiences.json.backup-phase-2'),
      experiencesPath
    );
    console.error('Backup restored.');
    process.exit(1);
  }
  
  console.log('\n=== DISTRIBUTION REPORT ===\n');
  
  const narrowingCounts: Record<string, number> = {};
  const confidenceCounts: Record<string, number> = { high: 0, medium: 0, low: 0 };
  const lowConfidenceIds: string[] = [];
  
  for (const narrowing of CANONICAL_NARROWINGS) {
    narrowingCounts[narrowing] = 0;
  }
  
  for (const assignment of validAssignments) {
    for (const narrowing of assignment.narrowings) {
      narrowingCounts[narrowing]++;
    }
    
    if (assignment.confidence === 'high') confidenceCounts.high++;
    else if (assignment.confidence === 'medium') confidenceCounts.medium++;
    else if (assignment.confidence === 'low') confidenceCounts.low++;
    
    if (assignment.confidence === 'low') {
      lowConfidenceIds.push(assignment.id);
    }
  }
  
  console.log('Narrowing distribution:');
  for (const narrowing of CANONICAL_NARROWINGS) {
    console.log(`  ${narrowing}: ${narrowingCounts[narrowing]}`);
  }
  
  const totalAssignments = Object.values(narrowingCounts).reduce((a, b) => a + b, 0);
  console.log(`\nTotal assignments (counting multi-narrowing entries once per narrowing): ${totalAssignments}`);
  
  const experientialRate = (narrowingCounts.experiential / validAssignments.length) * 100;
  console.log(`Experiential rate: ${experientialRate.toFixed(1)}% of entries`);
  
  console.log('\nConfidence distribution:');
  console.log(`  high: ${confidenceCounts.high}`);
  console.log(`  medium: ${confidenceCounts.medium}`);
  console.log(`  low: ${confidenceCounts.low}`);
  
  if (lowConfidenceIds.length > 0) {
    console.log(`\nLow confidence assignments (${lowConfidenceIds.length}):`);
    for (const id of lowConfidenceIds) {
      console.log(`  ${id}`);
    }
  }
  
  console.log('\n=== SPOT CHECK ===\n');
  
  const sampleIds = ['exp_002', 'exp_030', 'exp_052', 'exp_107', 'exp_172'];
  console.log('Verifying 5 sample entries:');
  for (const id of sampleIds) {
    const experience = experiencesData.experiences.find((e: any) => e.id === id);
    if (experience && experience.narrowings) {
      console.log(`  ${id}: ${JSON.stringify(experience.narrowings)}`);
    } else {
      console.log(`  ${id}: NO NARROWINGS FOUND`);
    }
  }
  
  console.log('\n✓ Phase 2 complete');
}

main();
