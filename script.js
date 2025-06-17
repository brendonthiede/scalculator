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
    'c5.2xlarge': { cpu: 8, memory: 16 },
    'r5a.xlarge': { cpu: 4, memory: 32 },
    'r5a.2xlarge': { cpu: 8, memory: 64 },
    'r5a.4xlarge': { cpu: 16, memory: 128 },
};

// Resource type configurations
const RESOURCE_CONFIGS = {
    scaledJob: {
        name: 'KEDA ScaledJob',
        fields: [
            { 
                id: 'replicaCount', 
                label: 'Replica Count', 
                type: 'group', 
                fields: [
                    { id: 'minReplicaCount', label: 'Min', type: 'number', min: 0, placeholder: '0' },
                    { id: 'maxReplicaCount', label: 'Max', type: 'number', min: 1, placeholder: '10' }
                ]
            },
            { id: 'parallelism', label: 'Parallelism', type: 'number', min: 1, placeholder: '1' },
            { 
                id: 'memory', 
                label: 'Memory (Mi)', 
                type: 'group', 
                fields: [
                    { id: 'requestedMemory', label: 'Requested', type: 'number', min: 1, placeholder: '256' },
                    { id: 'maxMemory', label: 'Limit', type: 'number', min: 1, placeholder: '512' }
                ]
            },
            { id: 'requestedCpu', label: 'CPU (m)', type: 'number', min: 1, placeholder: '100' }
        ]
    },
    scaledObject: {
        name: 'KEDA ScaledObject',
        fields: [
            { 
                id: 'replicaCount', 
                label: 'Replica Count', 
                type: 'group', 
                fields: [
                    { id: 'minReplicaCount', label: 'Min', type: 'number', min: 0, placeholder: '1' },
                    { id: 'maxReplicaCount', label: 'Max', type: 'number', min: 1, placeholder: '10' }
                ]
            },
            { 
                id: 'memory', 
                label: 'Memory (Mi)', 
                type: 'group', 
                fields: [
                    { id: 'requestedMemory', label: 'Requested', type: 'number', min: 1, placeholder: '256' },
                    { id: 'maxMemory', label: 'Limit', type: 'number', min: 1, placeholder: '512' }
                ]
            },
            { id: 'requestedCpu', label: 'CPU (m)', type: 'number', min: 1, placeholder: '100' }
        ]
    },
    deployment: {
        name: 'Deployment',
        fields: [
            { id: 'hasHPA', label: 'Has HPA', type: 'toggle' },
            { id: 'replicas', label: 'Replicas', type: 'number', min: 1, placeholder: '3', showWhen: { hasHPA: false } },
            { 
                id: 'replicaCount', 
                label: 'Replica Count', 
                type: 'group', 
                showWhen: { hasHPA: true },
                fields: [
                    { id: 'minReplicaCount', label: 'Min', type: 'number', min: 0, placeholder: '1' },
                    { id: 'maxReplicaCount', label: 'Max', type: 'number', min: 1, placeholder: '10' }
                ]
            },
            { 
                id: 'memory', 
                label: 'Memory (Mi)', 
                type: 'group', 
                fields: [
                    { id: 'requestedMemory', label: 'Requested', type: 'number', min: 1, placeholder: '256' },
                    { id: 'maxMemory', label: 'Limit', type: 'number', min: 1, placeholder: '512' }
                ]
            },
            { id: 'requestedCpu', label: 'CPU (m)', type: 'number', min: 1, placeholder: '100' }
        ]
    },
    statefulSet: {
        name: 'StatefulSet',
        fields: [
            { id: 'replicas', label: 'Replicas', type: 'number', min: 1, placeholder: '3' },
            { 
                id: 'memory', 
                label: 'Memory (Mi)', 
                type: 'group', 
                fields: [
                    { id: 'requestedMemory', label: 'Requested', type: 'number', min: 1, placeholder: '256' },
                    { id: 'maxMemory', label: 'Limit', type: 'number', min: 1, placeholder: '512' }
                ]
            },
            { id: 'requestedCpu', label: 'CPU (m)', type: 'number', min: 1, placeholder: '100' }
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
                html += this.generateFieldHTML(field, currentValues);
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
    generateFieldHTML(field, currentValues = {}) {
        if (field.type === 'toggle') {
            const currentValue = currentValues[field.id] || '';
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

        if (field.type === 'group') {
            let groupHTML = `<div class="form-group form-group-container">
                <label class="group-label">${field.label}:</label>
                <div class="input-group">`;
            
            field.fields.forEach(subField => {
                const currentValue = currentValues[subField.id] || '';
                groupHTML += `
                    <div class="input-group-item">
                        <label for="${subField.id}" class="sub-label">${subField.label}:</label>
                        <input 
                            type="${subField.type}" 
                            id="${subField.id}" 
                            name="${subField.id}"
                            ${subField.min !== undefined ? `min="${subField.min}"` : ''}
                            placeholder="${subField.placeholder || ''}"
                            value="${currentValue}"
                        >
                    </div>
                `;
            });
            
            groupHTML += `</div></div>`;
            return groupHTML;
        }

        const currentValue = currentValues[field.id] || '';
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
                // Use placeholder value as default if no value is entered
                const placeholderValue = parseFloat(input.placeholder) || 0;
                values[input.id] = parseFloat(input.value) || placeholderValue;
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

        // Use the same calculation logic as ScalculatorUtils for consistency
        let baseResult;
        switch (resourceType) {
            case 'scaledJob':
                baseResult = ScalculatorUtils.calculateScaledJob(values);
                break;
            case 'scaledObject':
                baseResult = ScalculatorUtils.calculateScaledObject(values);
                break;
            case 'deployment':
                baseResult = ScalculatorUtils.calculateDeployment(values);
                break;
            case 'statefulSet':
                baseResult = ScalculatorUtils.calculateStatefulSet(values);
                break;
            default:
                throw new Error('Unknown resource type');
        }

        // Calculate required instances
        const requiredInstances = this.calculateRequiredInstances(
            baseResult.maxPods, 
            baseResult.maxMemoryMi, 
            baseResult.maxCpuM, 
            instanceSpec
        );

        return {
            ...baseResult,
            requiredInstances
        };
    }

    /**
     * Calculate required instances based on resource requirements
     */
    calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec) {
        return ScalculatorUtils.calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec);
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
        const minReplicaCount = config.minReplicaCount || 0;
        const maxReplicaCount = config.maxReplicaCount || 0;
        const parallelism = config.parallelism || 1;
        const requestedMemory = config.requestedMemory || 0;
        const requestedCpu = config.requestedCpu || 0;
        const maxMemory = config.maxMemory || config.requestedMemory || 0;
        
        const minPods = minReplicaCount * parallelism;
        const maxPods = maxReplicaCount * parallelism;
        
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