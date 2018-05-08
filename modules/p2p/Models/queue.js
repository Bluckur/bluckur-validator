// Create a queue-like thing for Java


function Queue(length) {
    this.max = length;
    this.data = [];
  }
  
  Queue.prototype.add = function(record) {
    
    this.data.unshift(record);
    if (this.data.size > this.max)
    {
        this.remove();
    }
  }
  
  Queue.prototype.remove = function() {
    this.data.pop();
  }
  
  Queue.prototype.first = function() {
    return this.data[0];
  }
  
  Queue.prototype.last = function() {
    return this.data[this.data.length - 1];
  }
  
  Queue.prototype.size = function() {
    return this.data.length;
  }

  Queue.prototype.flip = function() {
      this.data.reverse();
  }
  
  // Create a Queue
  const q = new Queue(5);
  q.add(1);
  q.add(2);
  q.add(3);
  q.remove();
  console.log(q);
  console.log(`Size of the Queue: ${q.size()}`)
  q.flip();
  console.log(q);