# Scalculator

A calculator for determining the resource impact of different scaling decisions for various Kubernetes resources.

## Features

Scalculator supports resource calculations for:

- **KEDA ScaledJob** - Calculates resources considering parallelism, min/max replica counts, and memory/CPU requirements
- **KEDA ScaledObject** - Calculates resources for auto-scaling workloads with min/max replica bounds
- **Deployment** - Supports both HPA-enabled and static replica configurations
- **StatefulSet** - Calculates resources for stateful workloads with fixed replica counts

## Calculated Metrics

For each resource configuration, Scalculator provides:

- Minimum and maximum number of pods
- Total memory requirements (minimum and maximum)
- Total CPU requirements (minimum and maximum)
- Number of required instances based on selected instance type

## Instance Types

Scalculator includes predefined AWS instance types with their CPU and memory specifications:

- **T3 Family**: t3.micro, t3.small, t3.medium, t3.large, t3.xlarge
- **M5 Family**: m5.large, m5.xlarge, m5.2xlarge, m5.4xlarge
- **C5 Family**: c5.large, c5.xlarge, c5.2xlarge

## Usage

1. Open `index.html` in a web browser
2. Select your Kubernetes resource type from the dropdown
3. Choose an instance type for your cluster nodes
4. Fill in the resource requirements based on your workload
5. View the calculated results in real-time as you type

### Resource-Specific Inputs

#### KEDA ScaledJob
- Min Replica Count
- Max Replica Count  
- Parallelism
- Requested Memory (Mi)
- Requested CPU (m)
- Max Memory (Mi)

#### KEDA ScaledObject
- Min Replica Count
- Max Replica Count
- Requested Memory (Mi)
- Requested CPU (m)
- Max Memory (Mi)

#### Deployment
- Has HPA (toggle)
- If HPA enabled: Min/Max Replica Count
- If HPA disabled: Static Replica count
- Requested Memory (Mi)
- Requested CPU (m)
- Max Memory (Mi)

#### StatefulSet
- Replicas
- Requested Memory (Mi)
- Requested CPU (m)
- Max Memory (Mi)

## Development

### Prerequisites

- Node.js (for running tests)
- A modern web browser

### Setup

1. Clone or download the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Tests

Run the Jest test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:
- All resource type calculations
- Instance requirement calculations
- Edge cases (zero values, negative inputs, undefined values)
- Configuration validation
- Large number handling

### Project Structure

```
scalculator/
├── index.html          # Main application HTML
├── style.css           # Responsive CSS styling
├── script.js           # Core JavaScript functionality
├── package.json        # Node.js dependencies and scripts
├── test/
│   └── scalculator.test.js  # Jest unit tests
├── Spec.md            # Original specification
└── README.md          # This file
```

## Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Responsive Design**: Mobile-friendly with CSS Grid and Flexbox
- **Real-time Updates**: Calculations update automatically as you type
- **Modular Code**: Clean separation of concerns with utility functions

### Calculations

#### Pod Calculations
- **ScaledJob**: `max(minReplicaCount, parallelism)` to `max(maxReplicaCount, parallelism)`
- **ScaledObject**: `minReplicaCount` to `maxReplicaCount`
- **Deployment with HPA**: `minReplicaCount` to `maxReplicaCount`
- **Deployment without HPA**: Fixed `replicas` count
- **StatefulSet**: Fixed `replicas` count

#### Instance Requirements
Calculates required instances based on the most constraining factor:
- **Memory constraint**: `ceil(totalMemoryGB / instanceMemoryGB)`
- **CPU constraint**: `ceil(totalCpuCores / instanceCpuCores)`
- **Pod constraint**: `ceil(totalPods / 110)` (assuming max 110 pods per node)

### Browser Compatibility

- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see the LICENSE file for details.

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [KEDA Documentation](https://keda.sh/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) 