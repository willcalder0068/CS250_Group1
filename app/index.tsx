import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, TextInput, StatusBar } from 'react-native';

// --- TYPE DEFINITIONS for TypeScript ---
type MachineStatus = 'available' | 'in-use' | 'finishing' | 'broken';

interface Machine {
  id: number;
  type: 'washer' | 'dryer';
  status: MachineStatus;
  timer: number;
}

interface LaundryRoom {
  id: string;
  name: string;
  machines: Machine[];
}

// --- MOCK DATA (This would come from Firebase in a real app) ---
const INITIAL_DATA: { laundryRooms: LaundryRoom[] } = {
  laundryRooms: [
    {
      id: 'sentinelHall',
      name: 'Sentinel Hall',
      machines: [
        { id: 1, type: 'washer', status: 'available', timer: 0 },
        { id: 2, type: 'washer', status: 'in-use', timer: 1800 },
        { id: 3, type: 'washer', status: 'broken', timer: 0 },
        { id: 4, type: 'washer', status: 'available', timer: 0 },
        { id: 5, type: 'dryer', status: 'in-use', timer: 2700 },
        { id: 6, type: 'dryer', status: 'available', timer: 0 },
        { id: 7, type: 'dryer', status: 'finishing', timer: 240 },
        { id: 8, type: 'dryer', status: 'available', timer: 0 },
      ],
    },
    {
      id: 'pioneerPoint',
      name: 'Pioneer Point',
      machines: [
        { id: 9, type: 'washer', status: 'available', timer: 0 },
        { id: 10, type: 'washer', status: 'available', timer: 0 },
        { id: 11, type: 'dryer', status: 'in-use', timer: 1200 },
        { id: 12, type: 'dryer', status: 'broken', timer: 0 },
      ],
    },
  ],
};

// --- HELPER FUNCTIONS & CONSTANTS ---
const STATUS_CONFIG: Record<MachineStatus, { text: string; color: string }> = {
  available: { text: 'Available', color: '#10B981' },
  'in-use': { text: 'In Use', color: '#EF4444' },
  finishing: { text: 'Finishing Soon', color: '#F59E0B' },
  broken: { text: 'Out of Order', color: '#6B7280' },
};

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- UI COMPONENTS with TypeScript Props ---

const Header = () => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerTitle}>Laundry Tracker</Text>
    <Text style={styles.headerSubtitle}>Campus Laundry, Simplified.</Text>
  </View>
);

interface RoomSelectorProps {
  rooms: LaundryRoom[];
  selectedRoomId: string;
  onSelect: (id: string) => void;
}

const RoomSelector = ({ rooms, selectedRoomId, onSelect }: RoomSelectorProps) => (
  <View style={styles.roomSelectorContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {rooms.map((room) => (
        <TouchableOpacity
          key={room.id}
          style={[styles.roomTab, selectedRoomId === room.id && styles.roomTabActive]}
          onPress={() => onSelect(room.id)}
        >
          <Text style={[styles.roomTabText, selectedRoomId === room.id && styles.roomTabTextActive]}>
            {room.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

interface MachineCardProps {
  machine: Machine;
  onAction: (machine: Machine) => void;
}

const MachineCard = ({ machine, onAction }: MachineCardProps) => {
  const config = STATUS_CONFIG[machine.status];
  const isActionDisabled = machine.status === 'broken';

  return (
    <View style={styles.machineCard}>
      <View style={[styles.machineStatusIndicator, { backgroundColor: config.color }]} />
      <View style={styles.machineInfo}>
        <Text style={styles.machineType}>{machine.type.toUpperCase()} #{machine.id}</Text>
        <Text style={[styles.machineStatusText, { color: config.color }]}>{config.text}</Text>
        {(machine.status === 'in-use' || machine.status === 'finishing') && (
          <Text style={styles.machineTimer}>{formatTime(machine.timer)}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.actionButton, isActionDisabled && styles.actionButtonDisabled]}
        onPress={() => onAction(machine)}
        disabled={isActionDisabled}
      >
        <Text style={styles.actionButtonText}>
          {machine.status === 'available' ? 'Start' : 'Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (machine: Machine, message: string) => void;
  machine: Machine | null;
}

const ReportModal = ({ visible, onClose, onSubmit, machine }: ReportModalProps) => {
  const [reportMessage, setReportMessage] = useState('');

  const handleSubmit = () => {
    if (machine) {
      onSubmit(machine, reportMessage);
      setReportMessage('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Report Machine #{machine?.id}</Text>
          <Text style={styles.modalSubtitle}>Please describe the issue.</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g., 'not spinning', 'won't turn on'"
            placeholderTextColor="#9CA3AF"
            multiline
            value={reportMessage}
            onChangeText={setReportMessage}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSubmit]} onPress={handleSubmit}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


// --- MAIN APP COMPONENT ---

export default function Index() {
  const [laundryData, setLaundryData] = useState(INITIAL_DATA);
  const [selectedRoomId, setSelectedRoomId] = useState(INITIAL_DATA.laundryRooms[0].id);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLaundryData(prevData => {
        const newLaundryRooms = prevData.laundryRooms.map(room => ({
          ...room,
          machines: room.machines.map(machine => {
            if ((machine.status === 'in-use' || machine.status === 'finishing') && machine.timer > 0) {
              const newTimer = machine.timer - 1;
              let newStatus: MachineStatus = machine.status;
              if (newTimer <= 300 && newTimer > 0) {
                newStatus = 'finishing';
              } else if (newTimer === 0) {
                newStatus = 'available';
              }
              return { ...machine, timer: newTimer, status: newStatus };
            }
            return machine;
          }),
        }));
        return { laundryRooms: newLaundryRooms };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (machine: Machine) => {
    if (machine.status === 'available') {
      const cycleTime = machine.type === 'washer' ? 1800 : 2700;
      updateMachine(machine.id, { status: 'in-use', timer: cycleTime });
    } else {
      setSelectedMachine(machine);
      setModalVisible(true);
    }
  };

  const updateMachine = (machineId: number, newValues: Partial<Machine>) => {
    setLaundryData(prevData => {
      const newLaundryRooms = prevData.laundryRooms.map(room => ({
        ...room,
        machines: room.machines.map(m =>
          m.id === machineId ? { ...m, ...newValues } : m
        )
      }));
      return { laundryRooms: newLaundryRooms };
    });
  };

  const handleReportSubmit = (machine: Machine, message: string) => {
    console.log(`Reporting machine #${machine.id}: ${message}`);
    updateMachine(machine.id, { status: 'broken', timer: 0 });
  };

  const selectedRoom = laundryData.laundryRooms.find(r => r.id === selectedRoomId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header />
      <RoomSelector
        rooms={laundryData.laundryRooms}
        selectedRoomId={selectedRoomId}
        onSelect={setSelectedRoomId}
      />
      <ScrollView contentContainerStyle={styles.machinesGrid}>
        {selectedRoom?.machines.map(machine => (
          <MachineCard key={machine.id} machine={machine} onAction={handleAction} />
        ))}
      </ScrollView>
      <ReportModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReportSubmit}
        machine={selectedMachine}
      />
    </SafeAreaView>
  );
}

// --- STYLES (React Native StyleSheet) ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  roomSelectorContainer: {
    paddingHorizontal: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  roomTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#374151',
  },
  roomTabActive: {
    backgroundColor: '#4F46E5',
  },
  roomTabText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  roomTabTextActive: {
    color: '#FFF',
  },
  machinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 10,
  },
  machineCard: {
    width: '46%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 15,
    margin: '2%',
    position: 'relative',
    overflow: 'hidden',
  },
  machineStatusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
  },
  machineInfo: {
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  machineType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  machineStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  machineTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 15,
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  actionButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    color: '#FFF',
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#4B5563',
    marginRight: 10,
  },
  modalButtonSubmit: {
    backgroundColor: '#4F46E5',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});



// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Welcome to the Laundry Tracker App🧺🧼👕!</Text>
//     </View>
//   );
// }
