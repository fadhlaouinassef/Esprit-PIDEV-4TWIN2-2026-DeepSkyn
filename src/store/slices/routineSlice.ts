import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface RoutineStep {
  id: number;
  routine_id: number;
  ordre: number;
  action: string;
  completed?: boolean;
  completedAt?: string;
}

export interface Routine {
  id: number;
  user_id: number;
  type: 'morning' | 'night' | 'weekly';
  envie?: string;
  objectif?: string;
  steps?: RoutineStep[];
  createdAt?: string;
  updatedAt?: string;
}

interface RoutineState {
  routines: Routine[];
  currentRoutine: Routine | null;
  loading: boolean;
  error: string | null;
}

const initialState: RoutineState = {
  routines: [],
  currentRoutine: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUserRoutines = createAsyncThunk(
  'routine/fetchUserRoutines',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/${userId}/routines`);
      if (!response.ok) throw new Error('Failed to fetch routines');
      const data = await response.json();
      return data.routines;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

export const createRoutine = createAsyncThunk(
  'routine/createRoutine',
  async (
    routineData: { user_id: number; type: string; envie?: string; objectif?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/user/${routineData.user_id}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData),
      });
      if (!response.ok) throw new Error('Failed to create routine');
      const data = await response.json();
      return data.routine;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

export const updateRoutine = createAsyncThunk(
  'routine/updateRoutine',
  async (
    { id, updates }: { id: number; updates: Partial<Routine> },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/user/routines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update routine');
      const data = await response.json();
      return data.routine;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

export const deleteRoutine = createAsyncThunk(
  'routine/deleteRoutine',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/routines/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete routine');
      return id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

export const addRoutineStep = createAsyncThunk(
  'routine/addRoutineStep',
  async (
    stepData: { routine_id: number; ordre: number; action: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/user/routines/${stepData.routine_id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData),
      });
      if (!response.ok) throw new Error('Failed to add step');
      const data = await response.json();
      return data.step;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

export const markStepCompleted = createAsyncThunk(
  'routine/markStepCompleted',
  async (
    { routineId, stepId, completed }: { routineId: number; stepId: number; completed: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/user/routines/${routineId}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error('Failed to mark step');
      const data = await response.json();
      return { routineId, step: data.step };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return rejectWithValue(message);
    }
  }
);

// Slice
const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    setCurrentRoutine: (state, action: PayloadAction<Routine | null>) => {
      state.currentRoutine = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    toggleStepCompletedLocally: (state, action: PayloadAction<{ routineId: number; stepId: number }>) => {
      const routine = state.routines.find(r => r.id === action.payload.routineId);
      if (routine?.steps) {
        const step = routine.steps.find(s => s.id === action.payload.stepId);
        if (step) {
          step.completed = !step.completed;
          step.completedAt = step.completed ? new Date().toISOString() : undefined;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Routines
    builder.addCase(fetchUserRoutines.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserRoutines.fulfilled, (state, action) => {
      state.loading = false;
      state.routines = action.payload;
    });
    builder.addCase(fetchUserRoutines.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Routine
    builder.addCase(createRoutine.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createRoutine.fulfilled, (state, action) => {
      state.loading = false;
      state.routines.push(action.payload);
    });
    builder.addCase(createRoutine.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Routine
    builder.addCase(updateRoutine.fulfilled, (state, action) => {
      const index = state.routines.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.routines[index] = action.payload;
      }
    });

    // Delete Routine
    builder.addCase(deleteRoutine.fulfilled, (state, action) => {
      state.routines = state.routines.filter(r => r.id !== action.payload);
    });

    // Add Routine Step
    builder.addCase(addRoutineStep.fulfilled, (state, action) => {
      const routine = state.routines.find(r => r.id === action.payload.routine_id);
      if (routine) {
        if (!routine.steps) routine.steps = [];
        routine.steps.push(action.payload);
      }
    });

    // Mark Step Completed
    builder.addCase(markStepCompleted.fulfilled, (state, action) => {
      const routine = state.routines.find(r => r.id === action.payload.routineId);
      if (routine?.steps) {
        const stepIndex = routine.steps.findIndex(s => s.id === action.payload.step.id);
        if (stepIndex !== -1) {
          routine.steps[stepIndex] = action.payload.step;
        }
      }
    });
  },
});

export const { setCurrentRoutine, clearError, toggleStepCompletedLocally } = routineSlice.actions;
export default routineSlice.reducer;
