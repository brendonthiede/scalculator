/**
 * Scalculator - Kubernetes Resource Calculator
 * Main JavaScript functionality for dynamic input generation and calculations
 */

// Instance type configurations (CPU cores, Memory in GB)
const INSTANCE_TYPES = {
    't3.micro': { cpu: 1, memory: 1 },
    't3.small': { cpu: 2, memory: 2 },
    't3.medium': { cpu: 2, memory: 4 },
    't3.large': { cpu: 2, memory: 8 },
    't3.xlarge': { cpu: 4, memory: 16 },
    'm5.large': { cpu: 2, memory: 8 },
    'm5.xlarge': { cpu: 4, memory: 16 },
    'm5.2xlarge': { cpu: 8, memory: 32 },
    'm5.4xlarge': { cpu: 16, memory: 64 },
    'c5.large': { cpu: 2, memory: 4 },
    'c5.xlarge': { cpu: 4, memory: 8 },
    'c5.2xlarge': { cpu: 8, memory: 16 }
};

// Resource type configurations
const RESOURCE_CONFIGS = {
    scaledJob: {
        name: 'KEDA ScaledJob',
        fields: [
            { id: 'minReplicaCount', label: 'Min Replica Count', type: 'number', min: 0, placeholder: '1' },
            { id: 'maxReplicaCount', label: 'Max Replica Count', type: 'number', min: 1, placeholder: '10' },
            { id: 'parallelism', label: 'Parallelism', type: 'number', min: 1, placeholder: '1' },
            { id: 'requestedMemory', label: 'Requested Memory (Mi)', type: 'number', min: 1, placeholder: '256' },
            { id: 'requestedCpu', label: 'Requested CPU (m)', type: 'number', min: 1, placeholder: '100' },
            { id: 'maxMemory', label: 'Max Memory (Mi)', type: 'number', min: 1, placeholder: '512' }
        ]
    },
    scaledObject: {
        name: 'KEDA ScaledObject',
        fields: [
            { id: 'minReplicaCount', label: 'Min Replica Count', type: 'number', min: 0, placeholder: '1' },
            { id: 'maxReplicaCount', label: 'Max Replica Count', type: 'number', min: 1, placeholder: '10' },
            { id: 'requestedMemory', label: 'Requested Memory (Mi)', type: 'number', min: 1, placeholder: '256' },
            { id: 'requestedCpu', label: 'Requested CPU (m)', type: 'number', min: 1, placeholder: '100' },
            { id: 'maxMemory', label: 'Max Memory (Mi)', type: 'number', min: 1, placeholder: '512' }
        ]
    },
    deployment: {
        name: 'Deployment',
        fields: [
            { id: 'hasHPA', label: 'Has HPA', type: 'toggle' },
            { id: 'replicas', label: 'Replicas', type: 'number', min: 1, placeholder: '3', showWhen: { hasHPA: false } },
            { id: 'minReplicaCount', label: 'Min Replica Count', type: 'number', min: 0, placeholder: '1', showWhen: { hasHPA: true } },
            { id: 'maxReplicaCount', label: 'Max Replica Count', type: 'number', min: 1, placeholder: '10', showWhen: { hasHPA: true } },
            { id: 'requestedMemory', label: 'Requested Memory (Mi)', type: 'number', min: 1, placeholder: '256' },
            { id: 'requestedCpu', label: 'Requested CPU (m)', type: 'number', min: 1, placeholder: '100' },
            { id: 'maxMemory', label: 'Max Memory (Mi)', type: 'number', min: 1, placeholder: '512' }
        ]
    },
    statefulSet: {
        name: 'StatefulSet',
        fields: [
            { id: 'replicas', label: 'Replicas', type: 'number', min: 1, placeholder: '3' },
            { id: 'requestedMemory', label: 'Requested Memory (Mi)', type: 'number', min: 1, placeholder: '256' },
            { id: 'requestedCpu', label: 'Requested CPU (m)', type: 'number', min: 1, placeholder: '100' },
            { id: 'maxMemory', label: 'Max Memory (Mi)', type: 'number', min: 1, placeholder: '512' }
        ]
    }
};

class Scalculator {
    constructor() {
        this.resourceTypeSelect = document.getElementById('resourceType');
        this.instanceTypeSelect = document.getElementById('instanceType');
        this.dynamicInputsContainer = document.getElementById('dynamicInputs');
        this.resultElements = {
            minPods: document.getElementById('minPods'),
            maxPods: document.getElementById('maxPods'),
            minMemory: document.getElementById('minMemory'),
            maxMemory: document.getElementById('maxMemory'),
            minCpu: document.getElementById('minCpu'),
            maxCpu: document.getElementById('maxCpu'),
            requiredInstances: document.getElementById('requiredInstances')
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.renderInputs();
        this.calculateResults();
    }

    /**
     * Set up event listeners for form elements
     */
    setupEventListeners() {
        this.resourceTypeSelect.addEventListener('change', () => {
            this.renderInputs();
            this.calculateResults();
        });

        this.instanceTypeSelect.addEventListener('change', () => {
            this.calculateResults();
        });

        // Listen for changes in dynamic inputs
        this.dynamicInputsContainer.addEventListener('input', () => {
            this.calculateResults();
        });

        this.dynamicInputsContainer.addEventListener('change', (event) => {
            // Only handle toggle changes, not regular input changes
            if (event.target.type === 'checkbox') {
                this.handleToggleChange();
            } else {
                // For regular inputs, just recalculate
                this.calculateResults();
            }
        });
    }

    /**
     * Handle toggle changes (like HPA toggle)
     */
    handleToggleChange() {
        this.renderInputs();
        this.calculateResults();
    }

    /**
     * Render input fields based on selected resource type
     */
    renderInputs() {
        const resourceType = this.resourceTypeSelect.value;
        const config = RESOURCE_CONFIGS[resourceType];
        
        if (!config) return;

        let html = '';
        const currentValues = this.getCurrentValues();

        config.fields.forEach(field => {
            if (this.shouldShowField(field, currentValues)) {
                html += this.generateFieldHTML(field, currentValues[field.id]);
            }
        });

        this.dynamicInputsContainer.innerHTML = html;
    }

    /**
     * Check if a field should be shown based on conditions
     */
    shouldShowField(field, values) {
        if (!field.showWhen) return true;
        
        for (const [key, expectedValue] of Object.entries(field.showWhen)) {
            // Handle undefined values - for boolean conditions, treat undefined as false
            const actualValue = values[key] !== undefined ? values[key] : (typeof expectedValue === 'boolean' ? false : values[key]);
            if (actualValue !== expectedValue) {
                return false;
            }
        }
        return true;
    }

    /**
     * Generate HTML for a form field
     */
    generateFieldHTML(field, currentValue = '') {
        if (field.type === 'toggle') {
            return `
                <div class="form-group">
                    <div class="toggle-container">
                        <label for="${field.id}">${field.label}:</label>
                        <label class="toggle">
                            <input type="checkbox" id="${field.id}" name="${field.id}" ${currentValue ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label for="${field.id}">${field.label}:</label>
                <input 
                    type="${field.type}" 
                    id="${field.id}" 
                    name="${field.id}"
                    ${field.min !== undefined ? `min="${field.min}"` : ''}
                    placeholder="${field.placeholder || ''}"
                    value="${currentValue}"
                >
            </div>
        `;
    }

    /**
     * Get current values from all form inputs
     */
    getCurrentValues() {
        const values = {};
        const inputs = this.dynamicInputsContainer.querySelectorAll('input');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                values[input.id] = input.checked;
            } else if (input.type === 'number') {
                values[input.id] = parseFloat(input.value) || 0;
            } else {
                values[input.id] = input.value;
            }
        });

        return values;
    }

    /**
     * Calculate and display results
     */
    calculateResults() {
        const resourceType = this.resourceTypeSelect.value;
        const instanceType = this.instanceTypeSelect.value;
        const values = this.getCurrentValues();

        try {
            const results = this.calculateResourceMetrics(resourceType, values, instanceType);
            this.displayResults(results);
        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError();
        }
    }

    /**
     * Calculate resource metrics based on resource type and values
     */
    calculateResourceMetrics(resourceType, values, instanceType) {
        const instanceSpec = INSTANCE_TYPES[instanceType];
        if (!instanceSpec) {
            throw new Error('Invalid instance type');
        }

        let minPods, maxPods;

        // Calculate pod counts based on resource type
        switch (resourceType) {
            case 'scaledJob':
                minPods = Math.max(values.minReplicaCount || 0, values.parallelism || 1);
                maxPods = Math.max(values.maxReplicaCount || 0, values.parallelism || 1);
                break;
            
            case 'scaledObject':
                minPods = values.minReplicaCount || 0;
                maxPods = values.maxReplicaCount || 0;
                break;
            
            case 'deployment':
                if (values.hasHPA) {
                    minPods = values.minReplicaCount || 0;
                    maxPods = values.maxReplicaCount || 0;
                } else {
                    minPods = maxPods = values.replicas || 0;
                }
                break;
            
            case 'statefulSet':
                minPods = maxPods = values.replicas || 0;
                break;
            
            default:
                throw new Error('Unknown resource type');
        }

        // Calculate memory and CPU totals
        const requestedMemoryMi = values.requestedMemory || 0;
        const requestedCpuM = values.requestedCpu || 0;
        const maxMemoryMi = values.maxMemory || requestedMemoryMi;

        const minMemoryMi = minPods * requestedMemoryMi;
        const maxMemoryMiTotal = maxPods * maxMemoryMi;
        const minCpuM = minPods * requestedCpuM;
        const maxCpuM = maxPods * requestedCpuM;

        // Calculate required instances
        const requiredInstances = this.calculateRequiredInstances(
            maxPods, 
            maxMemoryMiTotal, 
            maxCpuM, 
            instanceSpec
        );

        return {
            minPods,
            maxPods,
            minMemoryMi,
            maxMemoryMi: maxMemoryMiTotal,
            minCpuM,
            maxCpuM,
            requiredInstances
        };
    }

    /**
     * Calculate required instances based on resource requirements
     */
    calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec) {
        if (pods === 0) return 0;

        // Convert Mi to GB and m to cores
        const requiredMemoryGB = memoryMi / 1024;
        const requiredCpuCores = cpuM / 1000;

        // Calculate instances needed based on memory and CPU constraints
        const instancesForMemory = Math.ceil(requiredMemoryGB / instanceSpec.memory);
        const instancesForCpu = Math.ceil(requiredCpuCores / instanceSpec.cpu);
        const instancesForPods = Math.ceil(pods / 110); // Typical max pods per node

        return Math.max(instancesForMemory, instancesForCpu, instancesForPods);
    }

    /**
     * Display calculated results
     */
    displayResults(results) {
        this.resultElements.minPods.textContent = results.minPods.toLocaleString();
        this.resultElements.maxPods.textContent = results.maxPods.toLocaleString();
        this.resultElements.minMemory.textContent = this.formatMemory(results.minMemoryMi);
        this.resultElements.maxMemory.textContent = this.formatMemory(results.maxMemoryMi);
        this.resultElements.minCpu.textContent = this.formatCpu(results.minCpuM);
        this.resultElements.maxCpu.textContent = this.formatCpu(results.maxCpuM);
        this.resultElements.requiredInstances.textContent = results.requiredInstances.toLocaleString();

        // Add calculated class for styling
        Object.values(this.resultElements).forEach(element => {
            element.classList.add('calculated');
        });
    }

    /**
     * Display error state
     */
    displayError() {
        Object.values(this.resultElements).forEach(element => {
            element.textContent = 'Error';
            element.classList.remove('calculated');
        });
    }

    /**
     * Format memory value for display
     */
    formatMemory(memoryMi) {
        if (memoryMi >= 1024) {
            return `${(memoryMi / 1024).toFixed(2)} Gi`;
        }
        return `${memoryMi.toLocaleString()} Mi`;
    }

    /**
     * Format CPU value for display
     */
    formatCpu(cpuM) {
        if (cpuM >= 1000) {
            return `${(cpuM / 1000).toFixed(2)} cores`;
        }
        return `${cpuM.toLocaleString()} m`;
    }
}

// Utility functions for testing
const ScalculatorUtils = {
    calculateScaledJob(config) {
        const minReplicaCount = Math.max(0, config.minReplicaCount || 0);
        const maxReplicaCount = Math.max(0, config.maxReplicaCount || 0);
        const parallelism = Math.max(0, config.parallelism || 1);
        const requestedMemory = Math.max(0, config.requestedMemory || 0);
        const requestedCpu = Math.max(0, config.requestedCpu || 0);
        const maxMemory = Math.max(0, config.maxMemory || config.requestedMemory || 0);
        
        const minPods = Math.max(minReplicaCount, parallelism);
        const maxPods = Math.max(maxReplicaCount, parallelism);
        
        return {
            minPods,
            maxPods,
            minMemoryMi: minPods * requestedMemory,
            maxMemoryMi: maxPods * maxMemory,
            minCpuM: minPods * requestedCpu,
            maxCpuM: maxPods * requestedCpu
        };
    },

    calculateScaledObject(config) {
        const minPods = Math.max(0, config.minReplicaCount || 0);
        const maxPods = Math.max(0, config.maxReplicaCount || 0);
        const requestedMemory = Math.max(0, config.requestedMemory || 0);
        const requestedCpu = Math.max(0, config.requestedCpu || 0);
        const maxMemory = Math.max(0, config.maxMemory || config.requestedMemory || 0);
        
        return {
            minPods,
            maxPods,
            minMemoryMi: minPods * requestedMemory,
            maxMemoryMi: maxPods * maxMemory,
            minCpuM: minPods * requestedCpu,
            maxCpuM: maxPods * requestedCpu
        };
    },

    calculateDeployment(config) {
        let minPods, maxPods;
        
        if (config.hasHPA) {
            minPods = Math.max(0, config.minReplicaCount || 0);
            maxPods = Math.max(0, config.maxReplicaCount || 0);
        } else {
            const replicas = Math.max(0, config.replicas || 0);
            minPods = maxPods = replicas;
        }
        
        const requestedMemory = Math.max(0, config.requestedMemory || 0);
        const requestedCpu = Math.max(0, config.requestedCpu || 0);
        const maxMemory = Math.max(0, config.maxMemory || config.requestedMemory || 0);
        
        return {
            minPods,
            maxPods,
            minMemoryMi: minPods * requestedMemory,
            maxMemoryMi: maxPods * maxMemory,
            minCpuM: minPods * requestedCpu,
            maxCpuM: maxPods * requestedCpu
        };
    },

    calculateStatefulSet(config) {
        const pods = Math.max(0, config.replicas || 0);
        const requestedMemory = Math.max(0, config.requestedMemory || 0);
        const requestedCpu = Math.max(0, config.requestedCpu || 0);
        const maxMemory = Math.max(0, config.maxMemory || config.requestedMemory || 0);
        
        return {
            minPods: pods,
            maxPods: pods,
            minMemoryMi: pods * requestedMemory,
            maxMemoryMi: pods * maxMemory,
            minCpuM: pods * requestedCpu,
            maxCpuM: pods * requestedCpu
        };
    },

    calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec) {
        if (pods === 0) return 0;

        const requiredMemoryGB = memoryMi / 1024;
        const requiredCpuCores = cpuM / 1000;

        const instancesForMemory = Math.ceil(requiredMemoryGB / instanceSpec.memory);
        const instancesForCpu = Math.ceil(requiredCpuCores / instanceSpec.cpu);
        const instancesForPods = Math.ceil(pods / 110);

        return Math.max(instancesForMemory, instancesForCpu, instancesForPods);
    }
};

// Initialize the application when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new Scalculator();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScalculatorUtils, INSTANCE_TYPES, RESOURCE_CONFIGS };
} 